import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const KLOD_MINT = "8V5ZKPSMixYnBg4t3RtSU9a1daHAh38Pyhea2R3Xpump";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, amount, signature } = body;

    // Validate inputs
    if (!from || !to || !amount || !signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current slot for the transaction
    const { data: statsData } = await supabase
      .from("network_stats")
      .select("slot")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    const currentSlot = statsData?.slot || 0;

    // Record transaction in klodchain
    const { error: txError } = await supabase.from("transactions").insert({
      signature: signature,
      slot: currentSlot,
      fee: 5000,
      status: "confirmed",
      transaction_type: "token_transfer",
      from_pubkey: from,
      to_pubkey: to,
      amount: amount * 1000000, // Convert to smallest unit (6 decimals)
      program_id: KLOD_MINT,
      instruction_data: {
        type: "spl_transfer",
        token: "KLOD",
        amount: amount,
        mint: KLOD_MINT,
        solana_signature: signature,
      },
      confirmed_at: new Date().toISOString(),
    });

    if (txError) {
      console.error("Failed to record transaction:", txError);
    }

    return NextResponse.json({
      success: true,
      signature: signature,
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
