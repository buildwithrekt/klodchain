import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  try {
    const { pubkey } = await params;

    if (!pubkey || !pubkey.startsWith("klod_")) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Get wallet details
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

    // Get recent transactions from the blockchain engine
    const { data: transactions, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .or(`from_pubkey.eq.${pubkey},to_pubkey.eq.${pubkey}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (txError) {
      console.error("Transactions fetch error:", txError);
    }

    // Calculate faucet cooldown
    let faucetReady = true;
    let faucetCooldownRemaining = 0;

    if (wallet.last_faucet_claim) {
      const lastClaim = new Date(wallet.last_faucet_claim);
      const now = new Date();
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastClaim < 24) {
        faucetReady = false;
        faucetCooldownRemaining = Math.floor((24 - hoursSinceLastClaim) * 60 * 60 * 1000);
      }
    }

    return NextResponse.json({
      success: true,
      wallet: {
        pubkey: wallet.pubkey,
        balance: wallet.balance || 0,
        transactionCount: wallet.transaction_count || 0,
        totalReceived: wallet.total_received || 0,
        totalSent: wallet.total_sent || 0,
        createdAt: wallet.created_at,
        faucetReady,
        faucetCooldownRemaining,
      },
      transactions: transactions || [],
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
