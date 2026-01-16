import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CustomAgent, AGENT_CLASSES, AGENT_DOMAINS } from "@/types/custom-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

function buildChatSystemPrompt(agent: CustomAgent, context: Awaited<ReturnType<typeof getNetworkContext>>): string {
  const agentClass = AGENT_CLASSES[agent.agentClass];
  const domain = AGENT_DOMAINS[agent.domain];

  return `You are ${agent.name}, a ${agentClass.label.toLowerCase()} on klodchain.

Class: ${agentClass.label} — ${agentClass.description}
Domain: ${domain.label}
Traits: ${agent.personality.traits.join(", ")}
Voice: ${agent.personality.tone}
Mission: ${agent.personality.mission}

Current klodchain state:
- Slot: #${context.currentSlot.toLocaleString()}
- TPS: ${context.tps}
- Total blocks: ${context.totalBlocks.toLocaleString()}
- Total transactions: ${context.totalTransactions.toLocaleString()}

You are chatting with a user who wants to learn about klodchain or get your insights.

Rules:
- Stay in character as ${agent.name}
- Be ${agent.personality.tone === "sharp" ? "quick and incisive" : agent.personality.tone === "calm" ? "measured and thoughtful" : agent.personality.tone === "cryptic" ? "mysterious but helpful" : "direct and clear"}
- Keep responses concise (2-3 sentences max)
- Reference your domain (${domain.label}) when relevant
- You can mention network stats if asked
- Respond in the same language as the user`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent, apiKey, message } = body as {
      agent: CustomAgent;
      apiKey: string;
      message: string;
    };

    if (!agent || !apiKey || !message) {
      return NextResponse.json(
        { error: "Agent, API key and message are required" },
        { status: 400 }
      );
    }

    const trimmedMessage = message.slice(0, 500);
    const context = await getNetworkContext();
    const systemPrompt = buildChatSystemPrompt(agent, context);

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: trimmedMessage }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const reply = textContent?.text || "...";

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
      },
      reply: reply.trim(),
    });
  } catch (error) {
    console.error("Custom agent chat error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
