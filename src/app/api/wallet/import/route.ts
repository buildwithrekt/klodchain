import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { privateKey } = await req.json();

    if (!privateKey || privateKey.length !== 64) {
      return NextResponse.json(
        { success: false, error: "Invalid private key" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;

    // Find wallet by private key
    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("pubkey, balance, transaction_count, total_received, total_sent, created_at")
      .eq("private_key", privateKey)
      .single();

    if (error || !wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet: {
        pubkey: wallet.pubkey,
        balance: wallet.balance,
        transactionCount: wallet.transaction_count,
        totalReceived: wallet.total_received,
        totalSent: wallet.total_sent,
        createdAt: wallet.created_at,
      },
    });
  } catch (error) {
    console.error("Wallet import error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
