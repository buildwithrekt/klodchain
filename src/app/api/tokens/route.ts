import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { birdeye } from "@/lib/birdeye";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(req.url);

    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") === "asc" ? true : false;
    const search = searchParams.get("search");
    const creator = searchParams.get("creator");

    let query = supabase
      .from("created_tokens")
      .select("*", { count: "exact" });

    // Filter by creator wallet
    if (creator) {
      query = query.eq("creator_wallet", creator);
    }

    // Search by name or symbol
    if (search) {
      query = query.or(`name.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    // Sort
    if (sort === "market_cap") {
      query = query.order("market_cap_sol", { ascending: order, nullsFirst: false });
    } else if (sort === "price") {
      query = query.order("price_sol", { ascending: order, nullsFirst: false });
    } else {
      query = query.order("created_at", { ascending: order });
    }

    const { data: tokens, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Tokens fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch tokens" },
        { status: 500 }
      );
    }

    // Get fresh prices from Birdeye for all tokens
    let enrichedTokens = tokens || [];
    try {
      const addresses = (tokens || []).map((t) => t.mint_address);
      if (addresses.length > 0) {
        const prices = await birdeye.getMultipleTokenPrices(addresses);
        const solPrice = await birdeye.getTokenPrice("So11111111111111111111111111111111111111112") || 200;

        enrichedTokens = (tokens || []).map((token) => {
          const priceUsd = prices.get(token.mint_address);
          if (priceUsd) {
            const priceInSol = priceUsd / solPrice;
            return {
              ...token,
              price_sol: priceInSol,
              // Estimate market cap: price * 1B tokens (standard pump.fun supply)
              market_cap_sol: priceInSol * 1_000_000_000,
              market_cap_usd: priceUsd * 1_000_000_000,
            };
          }
          return token;
        });
      }
    } catch (error) {
      console.error("Failed to fetch prices from Birdeye:", error);
      // Continue with DB data
    }

    return NextResponse.json({
      success: true,
      data: enrichedTokens,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Tokens API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
