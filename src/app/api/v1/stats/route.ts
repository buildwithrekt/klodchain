import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Maximum 10 requests per minute. Please wait before retrying.",
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const supabase = await createClient();

    // Fetch all stats in parallel
    const [
      blocksResult,
      txResult,
      validatorsResult,
      latestStatsResult,
      tokensResult,
    ] = await Promise.all([
      supabase.from("blocks").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase.from("validators").select("*", { count: "exact" }).eq("is_active", true),
      supabase
        .from("network_stats")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single(),
      supabase.from("created_tokens").select("*", { count: "exact", head: true }),
    ]);

    // Get latest block
    const { data: latestBlock } = await supabase
      .from("blocks")
      .select("slot, timestamp, blockhash")
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    // Get transaction type distribution
    const { data: txTypes } = await supabase
      .from("transactions")
      .select("transaction_type");

    const typeDistribution = (txTypes || []).reduce((acc: Record<string, number>, tx) => {
      const type = tx.transaction_type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(
      {
        success: true,
        data: {
          network: {
            name: "Klodchain",
            version: "1.0.0",
            cluster: "devnet",
          },
          currentSlot: latestBlock?.slot || 0,
          latestBlockhash: latestBlock?.blockhash || null,
          blockTime: latestBlock?.timestamp || null,
          stats: {
            totalBlocks: blocksResult.count || 0,
            totalTransactions: txResult.count || 0,
            totalTokens: tokensResult.count || 0,
            activeValidators: validatorsResult.count || 0,
            currentTps: latestStatsResult.data?.tps || 0,
          },
          transactionTypes: typeDistribution,
          validators: (validatorsResult.data || []).map((v) => ({
            pubkey: v.pubkey,
            name: v.name,
            stake: v.stake,
            blocksProduced: v.blocks_produced,
            isActive: v.is_active,
          })),
        },
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getRateLimitHeaders(rateLimit) }
    );
  }
}
