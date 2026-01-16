"use client";

import { useSimulationStore } from "@/stores/simulation-store";
import { formatTps } from "@/lib/utils/formatters";

export function TpsCounter() {
  const { tps } = useSimulationStore();

  return (
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold tabular-nums">{formatTps(tps)}</span>
      <span className="text-muted-foreground">TPS</span>
    </div>
  );
}
