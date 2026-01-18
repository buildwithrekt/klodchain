"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AgentNetwork } from "./AgentNetwork";
import { AgentFeed } from "./AgentFeed";
import { NetworkStats } from "./NetworkStats";
import { EpochProgress } from "./EpochProgress";
import { BlockFeed } from "./BlockFeed";
import { TransactionFeed } from "./TransactionFeed";
import { ValidatorLeaderboard } from "./ValidatorLeaderboard";
import { useSimulationStore } from "@/stores/simulation-store";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function Dashboard() {
  const { initialize, isInitialized } = useSimulationStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return (
    <motion.div
      className="container py-6 space-y-6 mx-auto max-w-7xl px-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Agent Network Status */}
      <motion.div variants={staggerItem}>
        <AgentNetwork />
      </motion.div>

      {/* Network Stats */}
      <motion.div variants={staggerItem}>
        <NetworkStats />
      </motion.div>

      {/* Agent Thoughts */}
      <motion.div variants={staggerItem}>
        <AgentFeed />
      </motion.div>

      {/* Epoch Progress */}
      <motion.div variants={staggerItem}>
        <EpochProgress />
      </motion.div>

      {/* Main Grid */}
      <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <BlockFeed />
        </div>
        <div className="min-w-0">
          <TransactionFeed />
        </div>
      </motion.div>

      {/* Validators */}
      <motion.div variants={staggerItem}>
        <ValidatorLeaderboard />
      </motion.div>
    </motion.div>
  );
}
