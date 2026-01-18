import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_PERSONALITIES } from "@/lib/agents/personalities";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Supabase client for context
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getNetworkContext() {
  const [blocksResult, txResult, statsResult] = await Promise.all([
    supabase.from("blocks").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase
      .from("network_stats")
      .select("tps, slot")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    totalBlocks: blocksResult.count || 0,
    totalTransactions: txResult.count || 0,
    currentSlot: statsResult.data?.slot || 0,
    tps: statsResult.data?.tps || 0,
  };
}

export async function POST(request: Request) {
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { message, agentRole } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Limit message length
    const trimmedMessage = message.slice(0, 500);

    // Get agent personality
    const agent = AGENT_PERSONALITIES[agentRole] || AGENT_PERSONALITIES.validator;

    // Get network context
    const context = await getNetworkContext();

    // Build chat system prompt
    const chatSystemPrompt = `${agent.systemPrompt}

You are now in a direct chat with a user who wants to learn about klodchain.

Current network state:
- Slot: #${context.currentSlot.toLocaleString()}
- TPS: ${context.tps}
- Total blocks: ${context.totalBlocks.toLocaleString()}
- Total transactions: ${context.totalTransactions.toLocaleString()}

Rules:
- Stay in character as ${agent.name}
- Be helpful but concise (2-3 sentences max)
- You can reference the network state if relevant
- Be friendly but maintain your personality
- If asked about things outside blockchain/klodchain, gently redirect
- Respond in the same language as the user (French or English)`;

    // Call Claude
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: chatSystemPrompt,
      messages: [
        {
          role: "user",
          content: trimmedMessage,
        },
      ],
    });

    // Extract text response
    const textContent = response.content.find((c) => c.type === "text");
    const reply = textContent?.text || "...";

    return NextResponse.json({
      success: true,
      agent: {
        name: agent.name,
        role: agent.role,
      },
      reply: reply.trim(),
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "Failed to get agent response" },
      { status: 500 }
    );
  }
}
