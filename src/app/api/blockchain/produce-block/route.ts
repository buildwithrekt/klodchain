import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple hash function for server-side
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateSignature(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 88; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generatePubkey(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 44; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate random transactions for activity
async function generateRandomTransactions(count: number): Promise<void> {
  const transactions = [];

  for (let i = 0; i < count; i++) {
    const amount = Math.floor(Math.random() * 10000000000) + 1000000; // 0.001 to 10 KLOD
    transactions.push({
      signature: generateSignature(),
      fee: 5000,
      status: "pending",
      transaction_type: "transfer",
      from_pubkey: generatePubkey(),
      to_pubkey: generatePubkey(),
      amount,
    });
  }

  if (transactions.length > 0) {
    await supabase.from("transactions").insert(transactions);
  }
}

export async function POST() {
  try {
    // Generate some random transactions for activity (1-5 per block)
    const randomTxCount = Math.floor(Math.random() * 5) + 1;
    await generateRandomTransactions(randomTxCount);

    // Get the latest block
    const { data: latestBlock } = await supabase
      .from("blocks")
      .select("*")
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    const currentSlot = latestBlock ? latestBlock.slot + 1 : 0;

    // Get validators for leader selection
    const { data: validators } = await supabase
      .from("validators")
      .select("*")
      .eq("is_active", true);

    if (!validators || validators.length === 0) {
      return NextResponse.json({ error: "No active validators" }, { status: 500 });
    }

    // Simple leader selection based on slot
    const leaderIndex = currentSlot % validators.length;
    const leader = validators[leaderIndex];

    // Get pending transactions that are old enough to be confirmed (at least 6 seconds / 3 blocks)
    const minAge = new Date(Date.now() - 6000).toISOString();
    const { data: pendingTxs } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .lt("created_at", minAge)
      .limit(100);

    const txCount = pendingTxs?.length || 0;
    const txSignatures = pendingTxs?.map((tx) => tx.signature) || [];

    // Generate block hash
    const pohHash = await sha256(`${currentSlot}:${Date.now()}`);
    const blockhash = await sha256(
      `${currentSlot}:${pohHash}:${txSignatures.join(",")}`
    );

    // Create the block
    const { data: newBlock, error: blockError } = await supabase
      .from("blocks")
      .insert({
        slot: currentSlot,
        parent_slot: latestBlock?.slot || null,
        blockhash,
        previous_blockhash: latestBlock?.blockhash || null,
        leader_pubkey: leader.pubkey,
        transaction_count: txCount,
        poh_hash: pohHash,
      })
      .select()
      .single();

    if (blockError) {
      console.error("Block creation error:", blockError);
      return NextResponse.json({ error: blockError.message }, { status: 500 });
    }

    // Update pending transactions to confirmed
    if (pendingTxs && pendingTxs.length > 0) {
      const txIds = pendingTxs.map((tx) => tx.id);
      await supabase
        .from("transactions")
        .update({
          status: "confirmed",
          slot: currentSlot,
          confirmed_at: new Date().toISOString(),
        })
        .in("id", txIds);
    }

    // Update validator stats
    await supabase
      .from("validators")
      .update({ blocks_produced: leader.blocks_produced + 1 })
      .eq("id", leader.id);

    // Update agent last_active
    await supabase
      .from("agents")
      .update({ last_active: new Date().toISOString() })
      .eq("pubkey", leader.pubkey);

    return NextResponse.json({
      success: true,
      block: newBlock,
      transactionsProcessed: txCount,
    });
  } catch (error) {
    console.error("Block production error:", error);
    return NextResponse.json(
      { error: "Failed to produce block" },
      { status: 500 }
    );
  }
}

// Also allow GET for cron jobs
export async function GET() {
  return POST();
}
