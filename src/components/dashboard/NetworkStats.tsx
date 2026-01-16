"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/stores/simulation-store";
import { formatNumber, formatTps, formatSlot } from "@/lib/utils/formatters";
import { Blocks, Activity, Users, Wallet } from "lucide-react";

export function NetworkStats() {
  const { currentSlot, tps, validators, accounts, transactions } =
    useSimulationStore();

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
      title: "Accounts",
      value: formatNumber(accounts.size),
      icon: Wallet,
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
