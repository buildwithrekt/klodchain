import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const KLOD_MINT = "8V5ZKPSMixYnBg4t3RtSU9a1daHAh38Pyhea2R3Xpump";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  try {
    // Get recent transfers involving this wallet
    const { data: transfers, error } = await supabase
      .from("transactions")
      .select("signature, from_pubkey, to_pubkey, amount, created_at, instruction_data")
      .eq("transaction_type", "token_transfer")
      .eq("program_id", KLOD_MINT)
      .or(`from_pubkey.eq.${wallet},to_pubkey.eq.${wallet}`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Format transfers with human-readable amounts
    const formattedTransfers = (transfers || []).map((tx) => ({
      signature: tx.signature,
      from_pubkey: tx.from_pubkey,
      to_pubkey: tx.to_pubkey,
      amount: tx.instruction_data?.amount || tx.amount / 1000000000,
      created_at: tx.created_at,
    }));

    return NextResponse.json({
      success: true,
      transfers: formattedTransfers,
    });
  } catch (error) {
    console.error("Transfers fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}
