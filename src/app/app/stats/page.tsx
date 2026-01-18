"use client";

import { motion } from "framer-motion";
import { useStats } from "@/hooks/useStats";
import {
  StatsOverview,
  TpsChart,
  TxTypeDistribution,
  ValidatorPerformance,
  StakeDistribution,
  TxStatusChart,
  FeeChart,
  TopAccounts,
} from "@/components/stats";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart3 } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function StatsPage() {
  const { stats, loading, refetch } = useStats(30000);

  return (
    <motion.div
      className="container mx-auto px-4 py-6 max-w-7xl"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Network Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Real-time blockchain statistics and metrics
            </p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={staggerItem} className="mb-6">
        <StatsOverview
          totalBlocks={stats.overview.totalBlocks}
          totalTxs={stats.overview.totalTxs}
          avgTps={stats.overview.avgTps}
          avgFee={stats.overview.avgFee}
          loading={loading}
        />
      </motion.div>

      {/* Row 1: TPS History + TX Types */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <TpsChart data={stats.tpsHistory} loading={loading} />
        </div>
        <div>
          <TxTypeDistribution data={stats.txByType} loading={loading} />
        </div>
      </motion.div>

      {/* Row 2: Validator Performance + Stake Distribution */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <ValidatorPerformance data={stats.validatorStats} loading={loading} />
        </div>
        <div>
          <StakeDistribution data={stats.validatorStats} loading={loading} />
        </div>
      </motion.div>

      {/* Row 3: TX Status + Fee Trends */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TxStatusChart data={stats.txByStatus} loading={loading} />
        <FeeChart data={stats.feeHistory} loading={loading} />
      </motion.div>

      {/* Row 4: Top Accounts */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopAccounts data={stats.topAccounts} loading={loading} />
      </motion.div>
    </motion.div>
  );
}
