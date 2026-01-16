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
    const { searchParams } = new URL(req.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!address || !address.endsWith("klod")) {
      return NextResponse.json(
        { success: false, error: "Invalid token address" },
        { status: 400 }
      );
    }

    // Get token total supply for percentage calculation
    const { data: token } = await supabase
      .from("tokens")
      .select("total_supply, circulating_supply")
      .eq("address", address)
      .single();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    // Get holders sorted by amount
    const { data: holders, error, count } = await supabase
      .from("token_holdings")
      .select("*", { count: "exact" })
      .eq("token_address", address)
      .gt("amount", 0)
      .order("amount", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Holders fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch holders" },
        { status: 500 }
      );
    }

    // Add percentage of supply
    const holdersWithPercentage = (holders || []).map((h, index) => ({
      rank: offset + index + 1,
      wallet_pubkey: h.wallet_pubkey,
      amount: h.amount / 1_000_000, // Convert from base units
      percentage: token.circulating_supply > 0
        ? ((h.amount / token.circulating_supply) * 100).toFixed(2)
        : "0.00",
    }));

    return NextResponse.json({
      success: true,
      data: holdersWithPercentage,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Holders API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
