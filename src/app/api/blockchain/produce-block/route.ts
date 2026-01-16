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

const FAIL_REASONS = [
  "Insufficient funds",
  "Invalid signature",
  "Account not found",
  "Blockhash expired",
  "Program error",
];

const TX_TYPES = [
  "transfer",
  "transfer",
  "transfer",
  "transfer",
  "create_account",
  "program_call",
  "stake",
  "vote",
];

// Program IDs (Solana-like format)
const PROGRAM_IDS = {
  system: "11111111111111111111111111111111",
  stake: "Stake11111111111111111111111111111111111",
  vote: "Vote111111111111111111111111111111111111111",
  token: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
};

// Sample program names for program_call
const PROGRAM_NAMES = [
  "KlodSwap",
  "KlodNFT",
  "KlodLend",
  "KlodDAO",
  "KlodBridge",
];

// Generate instruction data based on tx type
function generateInstructionData(txType: string, amount: number, toPubkey: string | null): object {
  switch (txType) {
    case "transfer":
      return {
        instruction: "transfer",
        lamports: amount,
        source: "wallet",
        destination: toPubkey,
      };
    case "create_account":
      const space = Math.floor(Math.random() * 1000) + 100;
      return {
        instruction: "createAccount",
        space,
        lamports: space * 8 + 890880, // rent exempt minimum
        owner: PROGRAM_IDS.system,
      };
    case "stake":
      return {
        instruction: "delegate",
        lamports: amount,
        validator: toPubkey,
        epoch: Math.floor(Math.random() * 100),
      };
    case "vote":
      return {
        instruction: "vote",
        slots: Array.from({ length: 3 }, () => Math.floor(Math.random() * 10000)),
        hash: generatePubkey().slice(0, 32),
        timestamp: Date.now(),
      };
    case "program_call":
      return {
        instruction: "invoke",
        program: PROGRAM_NAMES[Math.floor(Math.random() * PROGRAM_NAMES.length)],
        method: ["swap", "mint", "burn", "stake", "unstake"][Math.floor(Math.random() * 5)],
        accounts: Math.floor(Math.random() * 5) + 1,
      };
    default:
      return {};
  }
}

// Get program ID based on tx type
function getProgramId(txType: string): string {
  switch (txType) {
    case "transfer":
    case "create_account":
      return PROGRAM_IDS.system;
    case "stake":
      return PROGRAM_IDS.stake;
    case "vote":
      return PROGRAM_IDS.vote;
    case "program_call":
      return generatePubkey(); // Random program address
    default:
      return PROGRAM_IDS.system;
  }
}

// Generate random transactions for activity
async function generateRandomTransactions(count: number): Promise<void> {
  const transactions = [];

  for (let i = 0; i < count; i++) {
    const amount = Math.floor(Math.random() * 10000000000) + 1000000; // 0.001 to 10 KLOD
    const txType = TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)];
    // Random fee between 5000 and 50000 lamports (0.000005 to 0.00005 KLOD)
    const fee = Math.floor(Math.random() * 45000) + 5000;
    const toPubkey = txType === "transfer" || txType === "stake" ? generatePubkey() : null;

    // 5% chance of immediate failure
    const isFailed = Math.random() < 0.05;

    const instructionData = isFailed
      ? { error: FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)] }
      : generateInstructionData(txType, amount, toPubkey);

    transactions.push({
      signature: generateSignature(),
      fee,
      status: isFailed ? "failed" : "pending",
      transaction_type: txType,
      from_pubkey: generatePubkey(),
      to_pubkey: toPubkey,
      amount: txType === "transfer" || txType === "stake" ? amount : null,
      program_id: getProgramId(txType),
      instruction_data: instructionData,
    });
  }

  if (transactions.length > 0) {
    await supabase.from("transactions").insert(transactions);
  }
}

export async function POST() {
  try {
    // Generate some random transactions for activity (1-6 per block)
    const randomTxCount = Math.floor(Math.random() * 6) + 1;
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

    // Get pending transactions that are old enough to be confirmed (at least 200ms)
    const minAge = new Date(Date.now() - 200).toISOString();
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

    // Update pending transactions to confirmed with block_index
    if (pendingTxs && pendingTxs.length > 0) {
      // Update each transaction with its block_index
      await Promise.all(
        pendingTxs.map((tx, index) =>
          supabase
            .from("transactions")
            .update({
              status: "confirmed",
              slot: currentSlot,
              block_index: index,
              confirmed_at: new Date().toISOString(),
            })
            .eq("id", tx.id)
        )
      );
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
      transactionsGenerated: randomTxCount,
      transactionsConfirmed: txCount,
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
