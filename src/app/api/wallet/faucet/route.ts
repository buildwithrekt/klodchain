import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FAUCET_AMOUNT = 100;

// Generate a Solana-style base58 signature (88 chars)
function generateSignature(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let signature = "";
  const array = new Uint8Array(88);
  crypto.getRandomValues(array);
  for (let i = 0; i < 88; i++) {
    signature += chars[array[i] % chars.length];
  }
  return signature;
}
const FAUCET_COOLDOWN_HOURS = 24;

export async function POST(req: NextRequest) {
  try {
    const { pubkey } = await req.json();

    if (!pubkey || !pubkey.startsWith("klod_")) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("pubkey", pubkey)
      .single();

    if (walletError || !wallet) {
      console.error("Wallet not found:", walletError);
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Check cooldown
    if (wallet.last_faucet_claim) {
      const lastClaim = new Date(wallet.last_faucet_claim);
      const now = new Date();
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastClaim < FAUCET_COOLDOWN_HOURS) {
        const remainingMs = Math.floor((FAUCET_COOLDOWN_HOURS - hoursSinceLastClaim) * 60 * 60 * 1000);
        return NextResponse.json({
          success: false,
          error: "Faucet on cooldown",
          cooldownRemaining: remainingMs,
        }, { status: 429 });
      }
    }

    // Calculate new values
    const newBalance = (wallet.balance || 0) + FAUCET_AMOUNT;
    const newTxCount = (wallet.transaction_count || 0) + 1;
    const newTotalReceived = (wallet.total_received || 0) + FAUCET_AMOUNT;

    // Update wallet
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({
        balance: newBalance,
        last_faucet_claim: new Date().toISOString(),
        transaction_count: newTxCount,
        total_received: newTotalReceived,
      })
      .eq("pubkey", pubkey);

    if (updateError) {
      console.error("Error updating wallet:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update wallet" },
        { status: 500 }
      );
    }

    // Create wallet transaction record
    const { data: walletTx, error: walletTxError } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        from_pubkey: null,
        to_pubkey: pubkey,
        amount: FAUCET_AMOUNT,
        transaction_type: "faucet_claim",
      })
      .select()
      .single();

    if (walletTxError) {
      console.error("Error creating wallet transaction:", walletTxError);
    }

    // Also create a transaction in the blockchain engine
    const signature = generateSignature();

    // Get latest block slot
    const { data: latestBlock } = await supabaseAdmin
      .from("blocks")
      .select("slot")
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    const { data: blockchainTx, error: blockchainTxError } = await supabaseAdmin
      .from("transactions")
      .insert({
        signature,
        slot: latestBlock?.slot || null,
        fee: 0,
        status: "confirmed",
        transaction_type: "faucet_claim",
        from_pubkey: "FAUCET",
        to_pubkey: pubkey,
        amount: FAUCET_AMOUNT * 1_000_000, // Store in base units (6 decimals)
        program_id: "11111111111111111111111111111111", // System Program
        instruction_data: {
          type: "faucet_claim",
          amount: FAUCET_AMOUNT,
          recipient: pubkey,
        },
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (blockchainTxError) {
      console.error("Error creating blockchain transaction:", blockchainTxError);
    }

    return NextResponse.json({
      success: true,
      amount: FAUCET_AMOUNT,
      newBalance,
      transaction: blockchainTx,
    });
  } catch (error) {
    console.error("Faucet claim error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
