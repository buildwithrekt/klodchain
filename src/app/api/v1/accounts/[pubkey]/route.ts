import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Maximum 10 requests per minute. Please wait before retrying.",
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const supabase = await createClient();
    const { pubkey } = await params;
    const { searchParams } = new URL(req.url);
    const includeTxs = searchParams.get("transactions") === "true";

    if (!pubkey) {
      return NextResponse.json(
        { error: "Invalid pubkey", message: "Please provide a valid public key" },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Check if it's a wallet (klod_ prefix) or blockchain account
    const isWallet = pubkey.startsWith("klod_");

    if (isWallet) {
      // Fetch from wallets table
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("pubkey", pubkey)
        .single();

      if (walletError || !wallet) {
        return NextResponse.json(
          { error: "Account not found", message: `No account found with pubkey ${pubkey}` },
          { status: 404, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      let transactions = null;
      if (includeTxs) {
        const { data: txs } = await supabase
          .from("transactions")
          .select("signature, transaction_type, from_pubkey, to_pubkey, amount, fee, status, created_at")
          .or(`from_pubkey.eq.${pubkey},to_pubkey.eq.${pubkey}`)
          .order("created_at", { ascending: false })
          .limit(50);
        transactions = txs;
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            pubkey: wallet.pubkey,
            type: "wallet",
            balance: wallet.balance,
            transactionCount: wallet.transaction_count,
            totalSent: wallet.total_sent,
            totalReceived: wallet.total_received,
            createdAt: wallet.created_at,
            ...(transactions && { recentTransactions: transactions }),
          },
        },
        { headers: getRateLimitHeaders(rateLimit) }
      );
    } else {
      // Fetch from accounts table (blockchain accounts)
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select("*")
        .eq("pubkey", pubkey)
        .single();

      if (accountError || !account) {
        return NextResponse.json(
          { error: "Account not found", message: `No account found with pubkey ${pubkey}` },
          { status: 404, headers: getRateLimitHeaders(rateLimit) }
        );
      }

      let transactions = null;
      if (includeTxs) {
        const { data: txs } = await supabase
          .from("transactions")
          .select("signature, transaction_type, from_pubkey, to_pubkey, amount, fee, status, created_at")
          .or(`from_pubkey.eq.${pubkey},to_pubkey.eq.${pubkey}`)
          .order("created_at", { ascending: false })
          .limit(50);
        transactions = txs;
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            pubkey: account.pubkey,
            type: "account",
            owner: account.owner,
            lamports: account.lamports,
            data: account.data,
            executable: account.executable,
            rentEpoch: account.rent_epoch,
            createdAt: account.created_at,
            updatedAt: account.updated_at,
            ...(transactions && { recentTransactions: transactions }),
          },
        },
        { headers: getRateLimitHeaders(rateLimit) }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getRateLimitHeaders(rateLimit) }
    );
  }
}
