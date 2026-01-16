"use client";

import { useEffect, useState, useCallback } from "react";

export interface StatsData {
  overview: {
    totalBlocks: number;
    totalTxs: number;
    avgTps: number;
    avgFee: number;
  };
  tpsHistory: Array<{ slot: number; tps: number; recorded_at: string }>;
  txByType: Array<{ type: string; count: number }>;
  txByStatus: Array<{ status: string; count: number }>;
  validatorStats: Array<{
    name: string;
    pubkey: string;
    stake: number;
    blocksProduced: number;
    isActive: boolean;
  }>;
  feeHistory: Array<{ slot: number; avgFee: number }>;
  topAccounts: Array<{ pubkey: string; txCount: number }>;
  txVolume: Array<{ slot: number; count: number; timestamp: string }>;
}

const defaultStats: StatsData = {
  overview: { totalBlocks: 0, totalTxs: 0, avgTps: 0, avgFee: 0 },
  tpsHistory: [],
  txByType: [],
  txByStatus: [],
  validatorStats: [],
  feeHistory: [],
  topAccounts: [],
  txVolume: [],
};

export function useStats(refreshInterval = 30000) {
  const [stats, setStats] = useState<StatsData>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-refresh
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
}
