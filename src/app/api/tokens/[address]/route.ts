import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { birdeye } from "@/lib/birdeye";

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

    // Try to fetch fresh stats from Birdeye
    let birdeyeData = null;
    try {
      // Try meme token endpoint first
      birdeyeData = await birdeye.getMemeTokenDetail(address);

      // If not found, try general token overview
      if (!birdeyeData) {
        const overview = await birdeye.getTokenOverview(address);
        if (overview) {
          birdeyeData = {
            address: overview.address,
            name: overview.name,
            symbol: overview.symbol,
            logoURI: overview.logoURI,
            price: overview.price,
            priceChange24hPercent: overview.priceChange24h,
            volume24h: overview.volume24h,
            marketCap: overview.marketCap,
            liquidity: overview.liquidity,
            holder: overview.holder,
            supply: overview.supply,
            platform: "unknown",
            createdAt: 0,
            popularityScore: 0,
          };
        }
      }

      if (birdeyeData) {
        // Get SOL price to convert USD to SOL
        const solPrice = await birdeye.getTokenPrice("So11111111111111111111111111111111111111112");
        const priceInSol = solPrice ? birdeyeData.price / solPrice : 0;
        const marketCapInSol = solPrice ? birdeyeData.marketCap / solPrice : 0;

        // Update our DB with fresh stats (async, don't wait)
        supabaseAdmin
          .from("created_tokens")
          .update({
            price_sol: priceInSol,
            market_cap_sol: marketCapInSol,
            market_cap_usd: birdeyeData.marketCap,
            total_supply: birdeyeData.supply,
            image_url: birdeyeData.logoURI || token.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("mint_address", address)
          .then(() => {});
      }
    } catch (error) {
      console.error("Failed to fetch from Birdeye:", error);
      // Continue with cached data
    }

    // Fetch recent trades from Birdeye
    let recentTrades: Array<{
      id: string;
      token_mint: string;
      trade_type: "buy" | "sell";
      sol_amount: number;
      token_amount: number;
      trader_wallet: string;
      signature: string;
      created_at: string;
      volume_usd: number;
    }> = [];

    try {
      const birdeyeTrades = await birdeye.getTokenTrades({
        address,
        tx_type: "swap",
        limit: 50,
      });

      recentTrades = birdeyeTrades.map((trade) => ({
        id: trade.txHash,
        token_mint: address,
        trade_type: trade.side,
        sol_amount: trade.side === "buy" ? trade.from.amount : trade.to.amount,
        token_amount: trade.side === "buy" ? trade.to.amount : trade.from.amount,
        trader_wallet: trade.owner,
        signature: trade.txHash,
        created_at: new Date(trade.blockUnixTime * 1000).toISOString(),
        volume_usd: trade.volumeUSD,
      }));
    } catch (error) {
      console.error("Failed to fetch trades from Birdeye:", error);
    }

    // Get SOL price for conversion
    let solPrice = 200; // Default fallback
    try {
      const price = await birdeye.getTokenPrice("So11111111111111111111111111111111111111112");
      if (price) solPrice = price;
    } catch {
      // Use fallback
    }

    // Merge fresh data with our DB data
    const responseData = {
      ...token,
      // Override with fresh data if available
      ...(birdeyeData && {
        price_sol: birdeyeData.price / solPrice,
        market_cap_sol: birdeyeData.marketCap / solPrice,
        market_cap_usd: birdeyeData.marketCap,
        total_supply: birdeyeData.supply,
        image_url: birdeyeData.logoURI || token.image_url,
        holder_count: birdeyeData.holder,
        volume_24h: birdeyeData.volume24h,
        price_change_24h: birdeyeData.priceChange24hPercent,
      }),
      recent_trades: recentTrades || [],
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
