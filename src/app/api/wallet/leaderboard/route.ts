import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const currentWallet = searchParams.get("wallet");

    const supabase = supabaseAdmin;

    // Get top wallets by balance
    const { data: wallets, error } = await supabase
      .from("wallets")
      .select("pubkey, balance, transaction_count")
      .order("balance", { ascending: false })
      .order("transaction_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    // Add rank and check if current wallet is in list
    const leaderboard = wallets.map((wallet, index) => ({
      rank: index + 1,
      pubkey: wallet.pubkey,
      balance: wallet.balance,
      transactionCount: wallet.transaction_count,
      isCurrentWallet: wallet.pubkey === currentWallet,
    }));

    // If current wallet not in top list, get their rank
    let currentWalletRank = null;
    if (currentWallet && !leaderboard.some(w => w.isCurrentWallet)) {
      const { data: currentWalletData } = await supabase
        .from("wallets")
        .select("pubkey, balance, transaction_count")
        .eq("pubkey", currentWallet)
        .single();

      if (currentWalletData) {
        // Count how many wallets have higher balance
        const { count } = await supabase
          .from("wallets")
          .select("*", { count: "exact", head: true })
          .gt("balance", currentWalletData.balance);

        currentWalletRank = {
          rank: (count || 0) + 1,
          pubkey: currentWalletData.pubkey,
          balance: currentWalletData.balance,
          transactionCount: currentWalletData.transaction_count,
          isCurrentWallet: true,
        };
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      currentWalletRank,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
