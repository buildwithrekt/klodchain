"use client";

import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/stores/simulation-store";

export function SimulationStatus() {
  const { isRunning, isInitialized } = useSimulationStore();

  if (!isInitialized) {
    return <Badge variant="outline">Not Initialized</Badge>;
  }

  return (
    <Badge variant={isRunning ? "success" : "secondary"}>
      {isRunning ? "Running" : "Paused"}
    </Badge>
  );
}
