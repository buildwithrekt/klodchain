import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";

const KLOD_MINT = "8V5ZKPSMixYnBg4t3RtSU9a1daHAh38Pyhea2R3Xpump";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, amount, signature, message, timestamp } = body;

    // Validate inputs
    if (!from || !to || !amount || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check timestamp is recent (within 5 minutes)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "Signature expired" },
        { status: 400 }
      );
    }

    // Verify signature
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Buffer.from(signature, "base64");
      const publicKeyBytes = bs58.decode(from);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    } catch (verifyError) {
      console.error("Signature verification error:", verifyError);
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401 }
      );
    }

    // Check sender balance
    const { data: senderBalance, error: senderError } = await supabase
      .from("token_balances")
      .select("balance")
      .eq("wallet_address", from)
      .eq("token_mint", KLOD_MINT)
      .single();

    if (senderError || !senderBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    if (senderBalance.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Deduct from sender
    const { error: deductError } = await supabase
      .from("token_balances")
      .update({ balance: senderBalance.balance - amount, last_updated: new Date().toISOString() })
      .eq("wallet_address", from)
      .eq("token_mint", KLOD_MINT);

    if (deductError) {
      throw deductError;
    }

    // Add to recipient (upsert)
    const { data: recipientBalance } = await supabase
      .from("token_balances")
      .select("balance")
      .eq("wallet_address", to)
      .eq("token_mint", KLOD_MINT)
      .single();

    if (recipientBalance) {
      await supabase
        .from("token_balances")
        .update({ balance: recipientBalance.balance + amount, last_updated: new Date().toISOString() })
        .eq("wallet_address", to)
        .eq("token_mint", KLOD_MINT);
    } else {
      await supabase.from("token_balances").insert({
        wallet_address: to,
        token_mint: KLOD_MINT,
        balance: amount,
      });
    }

    // Get current slot for the transaction
    const { data: statsData } = await supabase
      .from("network_stats")
      .select("slot")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    const currentSlot = statsData?.slot || 0;

    // Generate transaction signature (mock)
    const txSignature = bs58.encode(
      Buffer.from(
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 256))
      )
    );

    // Record transaction in blockchain
    const { error: txError } = await supabase.from("transactions").insert({
      signature: txSignature,
      slot: currentSlot,
      fee: 5000,
      status: "confirmed",
      transaction_type: "token_transfer",
      from_pubkey: from,
      to_pubkey: to,
      amount: amount * 1000000000, // Convert to lamports equivalent
      program_id: KLOD_MINT,
      instruction_data: {
        type: "transfer",
        token: "KLOD",
        amount: amount,
        mint: KLOD_MINT,
      },
      confirmed_at: new Date().toISOString(),
    });

    if (txError) {
      console.error("Failed to record transaction:", txError);
      // Don't fail the transfer, just log
    }

    return NextResponse.json({
      success: true,
      signature: txSignature,
      from,
      to,
      amount,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      { error: "Transfer failed" },
      { status: 500 }
    );
  }
}
