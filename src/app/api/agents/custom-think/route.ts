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

function buildAgentSystemPrompt(agent: CustomAgent): string {
  const agentClass = AGENT_CLASSES[agent.agentClass];
  const domain = AGENT_DOMAINS[agent.domain];

  return `You are ${agent.name}, a ${agentClass.label.toLowerCase()} on klodchain.

Class: ${agentClass.label} — ${agentClass.description}
Domain: ${domain.label}
Traits: ${agent.personality.traits.join(", ")}
Voice: ${agent.personality.tone}
Mission: ${agent.personality.mission}

You observe the klodchain network and share insights from your unique perspective.
Your responses are ${agent.personality.tone === "sharp" ? "quick and cutting" : agent.personality.tone === "calm" ? "measured and deliberate" : agent.personality.tone === "cryptic" ? "mysterious and thought-provoking" : "direct and factual"}.

Keep responses to 1-2 sentences max. Stay in character. Be insightful.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent, apiKey } = body as { agent: CustomAgent; apiKey: string };

    if (!agent || !apiKey) {
      return NextResponse.json(
        { error: "Agent configuration and API key are required" },
        { status: 400 }
      );
    }

    const context = await getNetworkContext();
    const systemPrompt = buildAgentSystemPrompt(agent);

    const thoughtPrompt = `klodchain status:
- Slot: #${context.currentSlot.toLocaleString()}
- TPS: ${context.tps}
- Blocks: ${context.totalBlocks.toLocaleString()}
- Transactions: ${context.totalTransactions.toLocaleString()}

Share a brief observation about the network from your perspective as ${agent.name}. Focus on your domain: ${AGENT_DOMAINS[agent.domain].label}.`;

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: "user", content: thoughtPrompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const thought = textContent?.text || "...";

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        class: AGENT_CLASSES[agent.agentClass].label,
      },
      thought: thought.trim(),
      context: {
        slot: context.currentSlot,
        tps: context.tps,
      },
    });
  } catch (error) {
    console.error("Custom agent think error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to generate thought" },
      { status: 500 }
    );
  }
}
