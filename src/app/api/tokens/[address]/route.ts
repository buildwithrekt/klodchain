import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const supabase = await createClient();
    const { address } = await params;

    if (!address || !address.endsWith("klod")) {
      return NextResponse.json(
        { success: false, error: "Invalid token address" },
        { status: 400 }
      );
    }

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .eq("address", address)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    // Get holder count
    const { count: holderCount } = await supabase
      .from("token_holdings")
      .select("*", { count: "exact", head: true })
      .eq("token_address", address)
      .gt("amount", 0);

    // Get recent trades
    const { data: recentTrades } = await supabase
      .from("token_trades")
      .select("*")
      .eq("token_address", address)
      .order("created_at", { ascending: false })
      .limit(20);

    // Calculate 24h volume
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: dayTrades } = await supabase
      .from("token_trades")
      .select("klod_amount")
      .eq("token_address", address)
      .gte("created_at", oneDayAgo);

    const volume24h = (dayTrades || []).reduce(
      (sum, t) => sum + (t.klod_amount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ...token,
        holder_count: holderCount || 0,
        recent_trades: recentTrades || [],
        volume_24h: volume24h / 1_000_000, // Convert from base units
      },
    });
  } catch (error) {
    console.error("Token detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
