"use client";

import { useSimulationStore } from "@/stores/simulation-store";
import { formatTps } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function TpsCounter() {
  const { tps, isInitialized } = useSimulationStore();

  if (!isInitialized || tps < 0.01) {
    return (
      <div className="flex items-baseline gap-1">
        <Skeleton className="h-5 w-10" />
        <span className="text-muted-foreground">tps</span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-1">
      <span className="font-semibold tabular-nums">{formatTps(tps)}</span>
      <span className="text-muted-foreground">tps</span>
    </div>
  );
}
