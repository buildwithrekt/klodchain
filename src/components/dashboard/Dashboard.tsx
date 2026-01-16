"use client";

import { useEffect } from "react";
import { AgentNetwork } from "./AgentNetwork";
import { AgentFeed } from "./AgentFeed";
import { NetworkStats } from "./NetworkStats";
import { EpochProgress } from "./EpochProgress";
import { BlockFeed } from "./BlockFeed";
import { TransactionFeed } from "./TransactionFeed";
import { ValidatorLeaderboard } from "./ValidatorLeaderboard";
import { useSimulationStore } from "@/stores/simulation-store";

export function Dashboard() {
  const { initialize, isInitialized } = useSimulationStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return (
    <div className="container py-6 space-y-6 mx-auto max-w-7xl px-4">
      {/* Agent Network Status */}
      <AgentNetwork />

      {/* Network Stats */}
      <NetworkStats />

      {/* Agent Thoughts */}
      <AgentFeed />

      {/* Epoch Progress */}
      <EpochProgress />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BlockFeed />
        <TransactionFeed />
      </div>

      {/* Validators */}
      <ValidatorLeaderboard />
    </div>
  );
}
