import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pumpPortal } from "@/lib/pumpportal";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Invalid token address" },
        { status: 400 }
      );
    }

    // Get token from our DB
    const { data: token, error: tokenError } = await supabaseAdmin
      .from("created_tokens")
      .select("*")
      .eq("mint_address", address)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { success: false, error: "Token not found" },
        { status: 404 }
      );
    }

    // Try to fetch fresh stats from Pump.fun
    let pumpfunData = null;
    try {
      pumpfunData = await pumpPortal.getTokenInfo(address);

      // Update our DB with fresh stats (async, don't wait)
      supabaseAdmin
        .from("created_tokens")
        .update({
          price_sol: pumpfunData.market_cap / (pumpfunData.total_supply / 1e6),
          market_cap_sol: pumpfunData.market_cap,
          market_cap_usd: pumpfunData.usd_market_cap,
          virtual_sol_reserves: pumpfunData.virtual_sol_reserves,
          virtual_token_reserves: pumpfunData.virtual_token_reserves,
          total_supply: pumpfunData.total_supply,
          is_graduated: pumpfunData.complete,
          raydium_pool: pumpfunData.raydium_pool,
          image_url: pumpfunData.image_uri,
          updated_at: new Date().toISOString(),
        })
        .eq("mint_address", address)
        .then(() => {});
    } catch (error) {
      console.error("Failed to fetch from Pump.fun:", error);
      // Continue with cached data
    }

    // Get recent trades from our DB
    const { data: recentTrades } = await supabaseAdmin
      .from("token_trades")
      .select("*")
      .eq("token_mint", address)
      .order("created_at", { ascending: false })
      .limit(20);

    // Merge fresh Pump.fun data with our DB data
    const responseData = {
      ...token,
      // Override with fresh data if available
      ...(pumpfunData && {
        price_sol: pumpfunData.market_cap / (pumpfunData.total_supply / 1e6),
        market_cap_sol: pumpfunData.market_cap,
        market_cap_usd: pumpfunData.usd_market_cap,
        virtual_sol_reserves: pumpfunData.virtual_sol_reserves,
        virtual_token_reserves: pumpfunData.virtual_token_reserves,
        total_supply: pumpfunData.total_supply,
        is_graduated: pumpfunData.complete,
        raydium_pool: pumpfunData.raydium_pool,
        image_url: pumpfunData.image_uri,
        reply_count: pumpfunData.reply_count,
      }),
      recent_trades: recentTrades || [],
      pumpfun_url: `https://pump.fun/${address}`,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Token detail error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
