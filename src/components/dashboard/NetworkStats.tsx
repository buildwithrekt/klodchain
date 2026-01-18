"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulationStore } from "@/stores/simulation-store";
import { createClient } from "@/lib/supabase/client";
import { formatNumber, formatTps, formatSlot } from "@/lib/utils/formatters";
import { Blocks, Activity, Users, Receipt } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function NetworkStats() {
  const { currentSlot, tps, validators, isInitialized } = useSimulationStore();
  const [totalTxCount, setTotalTxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Fetch total transaction count
    const fetchCount = async () => {
      const { count } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true });
      setTotalTxCount(count || 0);
      setLoading(false);
    };

    fetchCount();

    // Subscribe to new transactions to update count
    const channel = supabase
      .channel("tx-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        () => {
          setTotalTxCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = [
    {
      title: "Current Slot",
      value: formatSlot(currentSlot),
      icon: Blocks,
      loading: false,
    },
    {
      title: "TPS",
      value: formatTps(tps),
      icon: Activity,
      loading: tps < 0.01,
    },
    {
      title: "Validators",
      value: validators.length.toString(),
      icon: Users,
      loading: false,
    },
    {
      title: "Transactions",
      value: formatNumber(totalTxCount),
      icon: Receipt,
      loading: false,
    },
  ];

  if (loading || !isInitialized) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          variants={staggerItem}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <motion.div
                  className="text-2xl font-bold"
                  key={stat.value}
                  initial={{ scale: 1.05, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {stat.value}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
