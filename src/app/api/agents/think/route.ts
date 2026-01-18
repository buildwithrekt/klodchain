import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_PERSONALITIES, getRandomAgent } from "@/lib/agents/personalities";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Use service role for writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NetworkContext {
  currentSlot: number;
  tps: number;
  totalBlocks: number;
  totalTransactions: number;
  activeValidators: number;
  latestBlock: {
    slot: number;
    transactionCount: number;
    leader: string;
    timestamp: string;
  } | null;
  recentActivity: string;
}

async function getNetworkContext(supabase: any): Promise<NetworkContext> {
  // Fetch current network state
  const [blocksResult, txResult, validatorsResult, latestBlockResult, statsResult] =
    await Promise.all([
      supabase.from("blocks").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase.from("validators").select("*").eq("is_active", true),
      supabase
        .from("blocks")
        .select("slot, transaction_count, leader_pubkey, timestamp")
        .order("slot", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("network_stats")
        .select("tps")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

  const latestBlock = latestBlockResult.data;
  const currentSlot = latestBlock?.slot || 0;
  const tps = statsResult.data?.tps || 0;

  // Get recent activity summary
  const recentTxResult = await supabase
    .from("transactions")
    .select("transaction_type, status")
    .order("created_at", { ascending: false })
    .limit(20);

  const recentTxs = recentTxResult.data || [];
  const txTypes = recentTxs.reduce((acc: Record<string, number>, tx: any) => {
    acc[tx.transaction_type] = (acc[tx.transaction_type] || 0) + 1;
    return acc;
  }, {});

  const failedCount = recentTxs.filter((tx: any) => tx.status === "failed").length;

  let recentActivity = `Recent 20 txs: ${Object.entries(txTypes)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ")}`;

  if (failedCount > 0) {
    recentActivity += `. ${failedCount} failed.`;
  }

  return {
    currentSlot,
    tps: Math.round(tps * 100) / 100,
    totalBlocks: blocksResult.count || 0,
    totalTransactions: txResult.count || 0,
    activeValidators: validatorsResult.data?.length || 0,
    latestBlock: latestBlock
      ? {
          slot: latestBlock.slot,
          transactionCount: latestBlock.transaction_count,
          leader: latestBlock.leader_pubkey,
          timestamp: latestBlock.timestamp,
        }
      : null,
    recentActivity,
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
    // Get optional specific agent role from request
    let agentRole: string | undefined;
    try {
      const body = await request.json();
      agentRole = body.role;
    } catch {
      // No body or invalid JSON, use random agent
    }

    // Select agent
    const agent = agentRole
      ? AGENT_PERSONALITIES[agentRole] || getRandomAgent()
      : getRandomAgent();

    // Get agent from DB for ID
    const { data: agentData } = await supabase
      .from("agents")
      .select("id")
      .eq("role", Object.keys(AGENT_PERSONALITIES).find(
        (key) => AGENT_PERSONALITIES[key].name === agent.name
      ) || "validator")
      .single();

    // Get network context
    const context = await getNetworkContext(supabase);

    // Build the user message with context
    const userMessage = `Current network state:
- Slot: #${context.currentSlot.toLocaleString()}
- TPS: ${context.tps}
- Total blocks: ${context.totalBlocks.toLocaleString()}
- Total transactions: ${context.totalTransactions.toLocaleString()}
- Active validators: ${context.activeValidators}
${context.latestBlock ? `- Latest block: #${context.latestBlock.slot} with ${context.latestBlock.transactionCount} txs (leader: ${context.latestBlock.leader.slice(0, 8)}...)` : ""}
- ${context.recentActivity}

Share a brief thought about the current state of the network from your perspective as ${agent.name}. Be in character. 1-2 sentences max.`;

    // Call Claude
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      system: agent.systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract text response
    const textContent = response.content.find((c) => c.type === "text");
    const message = textContent?.text || "...";

    // Store in database
    const { data: logEntry, error: insertError } = await supabase
      .from("agent_logs")
      .insert({
        agent_id: agentData?.id || null,
        agent_name: agent.name,
        agent_role: agent.role,
        message: message.trim(),
        context: {
          slot: context.currentSlot,
          tps: context.tps,
          totalBlocks: context.totalBlocks,
          totalTransactions: context.totalTransactions,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store agent log:", insertError);
    }

    return NextResponse.json({
      success: true,
      agent: {
        name: agent.name,
        role: agent.role,
      },
      message: message.trim(),
      context: {
        slot: context.currentSlot,
        tps: context.tps,
      },
      logId: logEntry?.id,
    });
  } catch (error) {
    console.error("Agent think error:", error);
    return NextResponse.json(
      { error: "Failed to generate agent thought" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch recent agent logs
export async function GET() {
  const { data: logs, error } = await supabase
    .from("agent_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }

  return NextResponse.json({ logs });
}
