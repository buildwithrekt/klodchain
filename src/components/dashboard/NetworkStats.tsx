"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/stores/simulation-store";
import { createClient } from "@/lib/supabase/client";
import { formatNumber, formatTps, formatSlot } from "@/lib/utils/formatters";
import { Blocks, Activity, Users, Receipt } from "lucide-react";

export function NetworkStats() {
  const { currentSlot, tps, validators } = useSimulationStore();
  const [totalTxCount, setTotalTxCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    // Fetch total transaction count
    const fetchCount = async () => {
      const { count } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true });
      setTotalTxCount(count || 0);
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
    },
    {
      title: "TPS",
      value: formatTps(tps),
      icon: Activity,
    },
    {
      title: "Validators",
      value: validators.length.toString(),
      icon: Users,
    },
    {
      title: "Transactions",
      value: formatNumber(totalTxCount),
      icon: Receipt,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
