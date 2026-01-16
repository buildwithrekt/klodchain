import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  try {
    const { fromPubkey, toPubkey, amount } = await req.json();

    // Validate inputs
    if (!fromPubkey || !fromPubkey.startsWith("klod_")) {
      return NextResponse.json(
        { success: false, error: "Invalid sender address" },
        { status: 400 }
      );
    }

    if (!toPubkey || !toPubkey.startsWith("klod_")) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient address" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { success: false, error: "Invalid amount (must be positive integer)" },
        { status: 400 }
      );
    }

    if (fromPubkey === toPubkey) {
      return NextResponse.json(
        { success: false, error: "Cannot send to yourself" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Get sender wallet
    const { data: sender, error: senderError } = await supabase
      .from("wallets")
      .select("*")
      .eq("pubkey", fromPubkey)
      .single();

    if (senderError || !sender) {
      return NextResponse.json(
        { success: false, error: "Sender wallet not found" },
        { status: 404 }
      );
    }

    // Check balance
    if (sender.balance < amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Get recipient wallet
    const { data: recipient, error: recipientError } = await supabase
      .from("wallets")
      .select("*")
      .eq("pubkey", toPubkey)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient wallet not found" },
        { status: 404 }
      );
    }

    // Update sender balance
    const { error: senderUpdateError } = await supabase
      .from("wallets")
      .update({
        balance: sender.balance - amount,
        transaction_count: sender.transaction_count + 1,
        total_sent: sender.total_sent + amount,
      })
      .eq("pubkey", fromPubkey);

    if (senderUpdateError) {
      console.error("Error updating sender:", senderUpdateError);
      return NextResponse.json(
        { success: false, error: "Failed to update sender balance" },
        { status: 500 }
      );
    }

    // Update recipient balance
    const { error: recipientUpdateError } = await supabase
      .from("wallets")
      .update({
        balance: recipient.balance + amount,
        transaction_count: recipient.transaction_count + 1,
        total_received: recipient.total_received + amount,
      })
      .eq("pubkey", toPubkey);

    if (recipientUpdateError) {
      // Rollback sender
      await supabase
        .from("wallets")
        .update({
          balance: sender.balance,
          transaction_count: sender.transaction_count,
          total_sent: sender.total_sent,
        })
        .eq("pubkey", fromPubkey);

      console.error("Error updating recipient:", recipientUpdateError);
      return NextResponse.json(
        { success: false, error: "Failed to update recipient balance" },
        { status: 500 }
      );
    }

    // Record wallet transaction
    const { data: walletTx } = await supabase
      .from("wallet_transactions")
      .insert({
        from_pubkey: fromPubkey,
        to_pubkey: toPubkey,
        amount,
        transaction_type: "transfer",
      })
      .select()
      .single();

    // Also create a transaction in the blockchain engine
    const signature = generateSignature();

    // Get latest block slot
    const { data: latestBlock } = await supabase
      .from("blocks")
      .select("slot")
      .order("slot", { ascending: false })
      .limit(1)
      .single();

    const { data: blockchainTx } = await supabase
      .from("transactions")
      .insert({
        signature,
        slot: latestBlock?.slot || null,
        fee: 0,
        status: "confirmed",
        transaction_type: "token_transfer",
        from_pubkey: fromPubkey,
        to_pubkey: toPubkey,
        amount: amount * 1_000_000, // Store in base units (6 decimals)
        program_id: "11111111111111111111111111111111", // System Program
        instruction_data: {
          type: "token_transfer",
          amount: amount,
          sender: fromPubkey,
          recipient: toPubkey,
        },
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      transaction: blockchainTx,
      newBalance: sender.balance - amount,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
