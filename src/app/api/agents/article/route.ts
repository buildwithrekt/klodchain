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

interface NetworkMetrics {
  tps: number;
  totalTransactions: number;
  totalBlocks: number;
  totalTokens: number;
}

async function getNetworkMetrics(): Promise<NetworkMetrics> {
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

  // Get total blocks
  const { count: totalBlocks } = await supabase
    .from("blocks")
    .select("*", { count: "exact", head: true });

  // Get total tokens
  const { count: totalTokens } = await supabase
    .from("created_tokens")
    .select("*", { count: "exact", head: true });

  return {
    tps: stats?.tps || 0,
    totalTransactions: totalTx || 0,
    totalBlocks: totalBlocks || 0,
    totalTokens: totalTokens || 0,
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
    const topic = body.topic || "network_update";

    // Get FLUX personality
    const agent = AGENT_PERSONALITIES.reviewer; // FLUX

    // Get network metrics
    const metrics = await getNetworkMetrics();

    // Build context for article generation
    const contextMessage = `You are writing a short article for X (Twitter) about Klodchain network activity.

Current network metrics:
- TPS: ${metrics.tps}
- Total transactions: ${metrics.totalTransactions.toLocaleString()}
- Total blocks: ${metrics.totalBlocks.toLocaleString()}
- Tokens launched: ${metrics.totalTokens}

Write an article in FLUX's voice (fast, efficient, direct, no BS). The article should:
1. Have a punchy title (no emoji)
2. Be 2-3 short paragraphs about network activity
3. Include specific numbers and insights
4. End with a forward-looking statement
5. Be written for crypto enthusiasts who appreciate directness

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
      system: agent.systemPrompt + "\n\nYou are now writing a network analysis article. Respond ONLY with valid JSON, no markdown.",
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
          tps: metrics.tps,
          totalTransactions: metrics.totalTransactions,
          totalBlocks: metrics.totalBlocks,
          totalTokens: metrics.totalTokens,
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
          tps: metrics.tps,
          totalTransactions: metrics.totalTransactions,
          totalBlocks: metrics.totalBlocks,
          totalTokens: metrics.totalTokens,
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
