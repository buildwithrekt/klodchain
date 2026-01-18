import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  try {
    // Parallel fetch all data
    const [
      blocksResult,
      txCountResult,
      tpsHistoryResult,
      txByTypeResult,
      txByStatusResult,
      validatorsResult,
      feeStatsResult,
      topAccountsResult,
    ] = await Promise.all([
      // Total blocks
      supabase.from("blocks").select("*", { count: "exact", head: true }),

      // Total transactions
      supabase.from("transactions").select("*", { count: "exact", head: true }),

      // TPS history (last 100 records)
      supabase
        .from("network_stats")
        .select("slot, tps, recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(100),

      // Transaction by type
      supabase.from("transactions").select("transaction_type"),

      // Transaction by status with time (slot)
      supabase
        .from("transactions")
        .select("status, slot, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),

      // Validators with stats
      supabase
        .from("validators")
        .select("name, pubkey, stake, blocks_produced, is_active")
        .order("stake", { ascending: false }),

      // Fee stats (last 1000 transactions)
      supabase
        .from("transactions")
        .select("fee, slot")
        .order("created_at", { ascending: false })
        .limit(1000),

      // Top accounts by transaction count
      supabase.from("transactions").select("from_pubkey").limit(5000),
    ]);

    // Calculate overview stats
    const totalBlocks = blocksResult.count || 0;
    const totalTxs = txCountResult.count || 0;

    // Calculate average TPS from history
    const tpsHistory = (tpsHistoryResult.data || []).reverse();
    const avgTps =
      tpsHistory.length > 0
        ? tpsHistory.reduce((sum, r) => sum + (r.tps || 0), 0) / tpsHistory.length
        : 0;

    // Calculate average fee
    const fees = feeStatsResult.data || [];
    const avgFee =
      fees.length > 0
        ? fees.reduce((sum, r) => sum + (r.fee || 0), 0) / fees.length
        : 0;

    // Aggregate transaction types
    const txTypes = txByTypeResult.data || [];
    const txByType = Object.entries(
      txTypes.reduce((acc: Record<string, number>, tx) => {
        const type = tx.transaction_type || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    ).map(([type, count]) => ({ type, count }));

    // Aggregate transaction status by time (grouped by slot ranges)
    const txStatuses = txByStatusResult.data || [];

    // Group by slot ranges (every 10 slots)
    const statusBySlot = txStatuses.reduce((acc: Record<number, Record<string, number>>, tx: any) => {
      const slotGroup = Math.floor((tx.slot || 0) / 10) * 10;
      if (!acc[slotGroup]) {
        acc[slotGroup] = { confirmed: 0, pending: 0, failed: 0 };
      }
      const status = tx.status || "pending";
      acc[slotGroup][status] = (acc[slotGroup][status] || 0) + 1;
      return acc;
    }, {});

    const txByStatus = Object.entries(statusBySlot)
      .map(([slot, counts]) => ({
        slot: parseInt(slot),
        confirmed: (counts as any).confirmed || 0,
        pending: (counts as any).pending || 0,
        failed: (counts as any).failed || 0,
      }))
      .sort((a, b) => a.slot - b.slot)
      .slice(-30);

    // Validator stats
    const validatorStats = (validatorsResult.data || []).map((v) => ({
      name: v.name,
      pubkey: v.pubkey,
      stake: v.stake,
      blocksProduced: v.blocks_produced,
      isActive: v.is_active,
    }));

    // Calculate fee history by slot (grouped)
    const feeBySlot = fees.reduce((acc: Record<number, { sum: number; count: number }>, tx) => {
      const slot = tx.slot;
      if (slot) {
        if (!acc[slot]) acc[slot] = { sum: 0, count: 0 };
        acc[slot].sum += tx.fee || 0;
        acc[slot].count += 1;
      }
      return acc;
    }, {});

    const feeHistory = Object.entries(feeBySlot)
      .map(([slot, data]) => ({
        slot: parseInt(slot),
        avgFee: data.sum / data.count,
      }))
      .sort((a, b) => a.slot - b.slot)
      .slice(-50);

    // Top accounts
    const accountCounts = (topAccountsResult.data || []).reduce(
      (acc: Record<string, number>, tx) => {
        const pubkey = tx.from_pubkey;
        if (pubkey) {
          acc[pubkey] = (acc[pubkey] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    const topAccounts = Object.entries(accountCounts)
      .map(([pubkey, count]) => ({ pubkey, txCount: count }))
      .sort((a, b) => b.txCount - a.txCount)
      .slice(0, 10);

    // TX volume by slot (last 50 slots)
    const txVolumeBySlot = txTypes.reduce((acc: Record<number, number>, tx: any) => {
      // We need slot info - fetch separately if needed
      return acc;
    }, {});

    // For TX volume, use TPS history as proxy
    const txVolume = tpsHistory.map((r) => ({
      slot: r.slot,
      count: Math.round((r.tps || 0) * 4), // Approximate: TPS * 4 seconds
      timestamp: r.recorded_at,
    }));

    return NextResponse.json({
      overview: {
        totalBlocks,
        totalTxs,
        avgTps: Math.round(avgTps * 100) / 100,
        avgFee: Math.round(avgFee),
      },
      tpsHistory: tpsHistory.slice(-50),
      txByType,
      txByStatus,
      validatorStats,
      feeHistory,
      topAccounts,
      txVolume: txVolume.slice(-50),
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
