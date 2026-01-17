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

    const period = searchParams.get("period") || "24h"; // 24h, 7d, 30d, all

    if (!address || !address.endsWith("klod")) {
      return NextResponse.json(
        { success: false, error: "Invalid token address" },
        { status: 400 }
      );
    }

    // Calculate time range
    let fromDate: Date;
    const now = new Date();
    switch (period) {
      case "1m":
        fromDate = new Date(now.getTime() - 60 * 1000);
        break;
      case "5m":
        fromDate = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case "15m":
        fromDate = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case "1h":
        fromDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(0); // All time
    }

    // Get trades for the period
    const { data: trades, error } = await supabase
      .from("memecoin_trades")
      .select("price_per_token, created_at, usdk_amount, trade_type")
      .eq("memecoin_address", address)
      .gte("created_at", fromDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Chart data error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch chart data" },
        { status: 500 }
      );
    }

    // Aggregate into time buckets for smoother chart
    // 1m/5m/15m = 5 sec buckets, 1h = 1 min buckets, 24h = 1 hour buckets, 7d/30d = 1 day buckets
    const bucketSize =
      period === "1m" || period === "5m" || period === "15m" ? 5000 :
      period === "1h" ? 60000 :
      period === "24h" ? 3600000 :
      86400000;
    const buckets: Map<number, { price: number; volume: number; count: number }> = new Map();

    for (const trade of trades || []) {
      const timestamp = new Date(trade.created_at).getTime();
      const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;
      // Convert price to number (Supabase returns DECIMAL as string)
      const price = Number(trade.price_per_token);
      const amount = Number(trade.usdk_amount || 0);

      const existing = buckets.get(bucketKey);
      if (existing) {
        existing.price = price; // Use latest price in bucket
        existing.volume += amount / 1_000_000;
        existing.count++;
      } else {
        buckets.set(bucketKey, {
          price,
          volume: amount / 1_000_000,
          count: 1,
        });
      }
    }

    // Convert to array
    const chartData = Array.from(buckets.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        time: new Date(timestamp).toISOString(),
        price: data.price,
        volume: data.volume,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Get current token price for starting point if no trades
    if (chartData.length === 0) {
      const { data: token } = await supabase
        .from("memecoins")
        .select("price, created_at")
        .eq("address", address)
        .single();

      if (token) {
        const tokenPrice = Number(token.price);
        chartData.push({
          timestamp: new Date(token.created_at).getTime(),
          time: token.created_at,
          price: tokenPrice,
          volume: 0,
        });
        chartData.push({
          timestamp: now.getTime(),
          time: now.toISOString(),
          price: tokenPrice,
          volume: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: chartData,
      period,
    });
  } catch (error) {
    console.error("Chart API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
