import { NextRequest, NextResponse } from "next/server";
import { birdeye, type OHLCVInterval } from "@/lib/birdeye";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(req.url);

    // Get interval from query params (default 5m)
    const intervalParam = searchParams.get("interval") || "5";

    // Map to Birdeye interval format
    const intervalMap: Record<string, OHLCVInterval> = {
      "1": "1m", "1m": "1m",
      "5": "5m", "5m": "5m",
      "15": "15m", "15m": "15m",
      "30": "30m", "30m": "30m",
      "60": "1H", "1H": "1H",
      "240": "4H", "4H": "4H",
      "1440": "1D", "1D": "1D",
    };
    const birdeyeInterval = intervalMap[intervalParam] || "5m";

    // Get time range from query params (default last 24h)
    const now = Math.floor(Date.now() / 1000);
    const defaultFrom = now - 24 * 60 * 60; // 24 hours ago
    const time_from = parseInt(searchParams.get("time_from") || defaultFrom.toString());
    const time_to = parseInt(searchParams.get("time_to") || now.toString());

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Invalid token address" },
        { status: 400 }
      );
    }

    // Fetch OHLCV data from Birdeye
    const ohlcvData = await birdeye.getOHLCV({
      address,
      type: birdeyeInterval,
      time_from,
      time_to,
    });

    // Transform to chart-friendly format
    const chartData = ohlcvData.map((candle) => ({
      timestamp: candle.unixTime * 1000,
      time: new Date(candle.unixTime * 1000).toISOString(),
      open: candle.o,
      high: candle.h,
      low: candle.l,
      close: candle.c,
      price: candle.c,
      volume: candle.v,
    }));

    return NextResponse.json({
      success: true,
      data: chartData,
      interval: birdeyeInterval,
      time_from,
      time_to,
    });
  } catch (error) {
    console.error("Chart API error:", error);
    return NextResponse.json({
      success: false,
      data: [],
      error: "Failed to fetch chart data",
    });
  }
}
