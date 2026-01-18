import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
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
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Token address is required" },
        { status: 400, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from("memecoins")
      .select("*")
      .eq("address", address)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // Get holder count
    const { count: holderCount } = await supabase
      .from("memecoin_holdings")
      .select("*", { count: "exact", head: true })
      .eq("memecoin_address", address)
      .gt("amount", 0);

    // Get recent trades
    const { data: recentTrades } = await supabase
      .from("memecoin_trades")
      .select("*")
      .eq("memecoin_address", address)
      .order("created_at", { ascending: false })
      .limit(20);

    // Calculate 24h volume
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dayTrades } = await supabase
      .from("memecoin_trades")
      .select("klod_amount")
      .eq("memecoin_address", address)
      .gte("created_at", oneDayAgo);

    const volume24h = (dayTrades || []).reduce(
      (sum, t) => sum + (t.klod_amount || 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...token,
          holder_count: holderCount || 0,
          recent_trades: recentTrades || [],
          volume_24h_calculated: volume24h / 1_000_000,
        },
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: getRateLimitHeaders(rateLimit) }
    );
  }
}
