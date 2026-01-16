"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Blocks, Receipt, Activity, Coins } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

interface StatsOverviewProps {
  totalBlocks: number;
  totalTxs: number;
  avgTps: number;
  avgFee: number;
  loading?: boolean;
}

export function StatsOverview({
  totalBlocks,
  totalTxs,
  avgTps,
  avgFee,
  loading,
}: StatsOverviewProps) {
  const stats = [
    {
      label: "Total Blocks",
      value: formatNumber(totalBlocks),
      icon: Blocks,
      color: "text-cyan-400",
    },
    {
      label: "Total Transactions",
      value: formatNumber(totalTxs),
      icon: Receipt,
      color: "text-emerald-400",
    },
    {
      label: "Avg TPS",
      value: avgTps.toFixed(2),
      icon: Activity,
      color: "text-orange-400",
    },
    {
      label: "Avg Fee",
      value: `${formatNumber(avgFee)} lamports`,
      icon: Coins,
      color: "text-purple-400",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.label}
            </div>
            <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
