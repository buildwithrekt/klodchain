import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get latest block
    const { data: latestBlock } = await supabase
      .from("blocks")
      .select("*")
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    // Get block count
    const { count: blockCount } = await supabase
      .from("blocks")
      .select("*", { count: "exact", head: true });

    // Get transaction count
    const { count: txCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true });

    // Get agents
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .order("created_at");

    // Get validators
    const { data: validators } = await supabase
      .from("validators")
      .select("*")
      .order("stake", { ascending: false });

    // Calculate TPS (transactions in last 10 seconds)
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const { count: recentTxCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("confirmed_at", tenSecondsAgo);

    const tps = (recentTxCount || 0) / 10;

    return NextResponse.json({
      currentSlot: latestBlock?.slot || 0,
      latestBlock,
      blockCount: blockCount || 0,
      transactionCount: txCount || 0,
      tps,
      agents: agents || [],
      validators: validators || [],
    });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
