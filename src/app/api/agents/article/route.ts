import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_PERSONALITIES } from "@/lib/agents/personalities";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TradingMetrics {
  totalTrades24h: number;
  totalVolume24h: number;
  topTokens: { symbol: string; volume: number; trades: number }[];
  biggestTrade: { symbol: string; amount: number; type: string } | null;
  tps: number;
  totalTransactions: number;
  recentTrades: { symbol: string; type: string; amount: number; time: string }[];
}

async function getTradingMetrics(): Promise<TradingMetrics> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get recent trades
  const { data: trades } = await supabase
    .from("memecoin_trades")
    .select(`
      *,
      memecoin:memecoins(symbol, name)
    `)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false })
    .limit(100);

  // Get TPS
  const { data: stats } = await supabase
    .from("network_stats")
    .select("tps")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  // Get total transactions
  const { count: totalTx } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

  // Process trades
  const tokenVolumes: Record<string, { volume: number; trades: number; symbol: string }> = {};
  let biggestTrade: TradingMetrics["biggestTrade"] = null;

  (trades || []).forEach((trade: any) => {
    const symbol = trade.memecoin?.symbol || "UNKNOWN";
    const volume = trade.usdk_amount / 1_000_000; // Convert from base units

    if (!tokenVolumes[symbol]) {
      tokenVolumes[symbol] = { volume: 0, trades: 0, symbol };
    }
    tokenVolumes[symbol].volume += volume;
    tokenVolumes[symbol].trades += 1;

    if (!biggestTrade || volume > biggestTrade.amount) {
      biggestTrade = { symbol, amount: volume, type: trade.trade_type };
    }
  });

  const topTokens = Object.values(tokenVolumes)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  const recentTrades = (trades || []).slice(0, 10).map((t: any) => ({
    symbol: t.memecoin?.symbol || "UNKNOWN",
    type: t.trade_type,
    amount: t.usdk_amount / 1_000_000,
    time: t.created_at,
  }));

  return {
    totalTrades24h: trades?.length || 0,
    totalVolume24h: Object.values(tokenVolumes).reduce((sum, t) => sum + t.volume, 0),
    topTokens,
    biggestTrade,
    tps: stats?.tps || 0,
    totalTransactions: totalTx || 0,
    recentTrades,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const topic = body.topic || "market_analysis";

    // Get FLUX personality
    const agent = AGENT_PERSONALITIES.reviewer; // FLUX

    // Get trading metrics
    const metrics = await getTradingMetrics();

    // Build context for article generation
    const contextMessage = `You are writing a short article for X (Twitter) about klodchain trading activity.

Current trading metrics (last 24h):
- Total trades: ${metrics.totalTrades24h}
- Total volume: $${metrics.totalVolume24h.toFixed(2)} USDK
- TPS: ${metrics.tps}
- Total network transactions: ${metrics.totalTransactions.toLocaleString()}

Top tokens by volume:
${metrics.topTokens.map((t, i) => `${i + 1}. $${t.symbol}: $${t.volume.toFixed(2)} USDK (${t.trades} trades)`).join("\n")}

${metrics.biggestTrade ? `Biggest trade: ${metrics.biggestTrade.type.toUpperCase()} $${metrics.biggestTrade.symbol} for $${metrics.biggestTrade.amount.toFixed(2)} USDK` : ""}

Recent trades:
${metrics.recentTrades.map(t => `- ${t.type.toUpperCase()} $${t.symbol}: $${t.amount.toFixed(2)} USDK`).join("\n")}

Write an article in FLUX's voice (fast, efficient, direct, no BS). The article should:
1. Have a punchy title (no emoji)
2. Be 2-3 short paragraphs analyzing the trading activity
3. Include specific numbers and insights
4. End with a forward-looking statement
5. Be written for crypto traders who appreciate directness

Also provide a thread version: 4-5 tweets that could be posted as a thread. Each tweet should be under 280 characters. Format as JSON array of strings.

Respond in this exact JSON format:
{
  "title": "Article title here",
  "content": "Full article content here...",
  "thread": ["Tweet 1", "Tweet 2", "Tweet 3", "Tweet 4"]
}`;

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: agent.systemPrompt + "\n\nYou are now writing a trading analysis article. Respond ONLY with valid JSON, no markdown.",
      messages: [
        {
          role: "user",
          content: contextMessage,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.text || "{}";

    // Parse JSON response
    let articleData;
    try {
      articleData = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse article response");
      }
    }

    // Store in database
    const { data: article, error: insertError } = await supabase
      .from("agent_articles")
      .insert({
        agent_name: agent.name,
        agent_role: agent.role,
        title: articleData.title,
        content: articleData.content,
        thread_content: articleData.thread,
        topic,
        metrics: {
          totalTrades24h: metrics.totalTrades24h,
          totalVolume24h: metrics.totalVolume24h,
          topTokens: metrics.topTokens,
          tps: metrics.tps,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store article:", insertError);
    }

    return NextResponse.json({
      success: true,
      article: {
        id: article?.id,
        agent: {
          name: agent.name,
          role: agent.role,
        },
        title: articleData.title,
        content: articleData.content,
        thread: articleData.thread,
        metrics: {
          totalTrades24h: metrics.totalTrades24h,
          totalVolume24h: metrics.totalVolume24h,
          topTokens: metrics.topTokens,
        },
        createdAt: article?.created_at,
      },
    });
  } catch (error) {
    console.error("Article generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate article" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch recent articles
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const agent = searchParams.get("agent");

  let query = supabase
    .from("agent_articles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agent) {
    query = query.eq("agent_name", agent);
  }

  const { data: articles, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }

  return NextResponse.json({ success: true, articles });
}
