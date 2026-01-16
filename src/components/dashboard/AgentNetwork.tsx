"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents, type Agent } from "@/hooks/useAgents";

// Agent display info with meaningful names and roles
const AGENT_INFO: Record<string, { displayName: string; description: string }> = {
  validator: { displayName: "VEX", description: "Block Producer" },
  architect: { displayName: "ARC", description: "Network Design" },
  analyst: { displayName: "SCAN", description: "Chain Monitor" },
  reviewer: { displayName: "FLUX", description: "TX Processor" },
  consensus: { displayName: "SYNC", description: "Consensus Engine" },
  oracle: { displayName: "SAGE", description: "Data Oracle" },
};

// Fallback agents for when DB is empty (function to get fresh timestamps)
const getFallbackAgents = (): Agent[] => [
  { id: "1", pubkey: "", name: "VEX", role: "validator", status: "active", uptime: 99.9, last_active: new Date().toISOString(), created_at: "" },
  { id: "2", pubkey: "", name: "ARC", role: "architect", status: "active", uptime: 99.8, last_active: new Date().toISOString(), created_at: "" },
  { id: "3", pubkey: "", name: "SCAN", role: "analyst", status: "active", uptime: 99.9, last_active: new Date().toISOString(), created_at: "" },
  { id: "4", pubkey: "", name: "FLUX", role: "reviewer", status: "active", uptime: 99.7, last_active: new Date().toISOString(), created_at: "" },
  { id: "5", pubkey: "", name: "SYNC", role: "consensus", status: "active", uptime: 99.9, last_active: new Date().toISOString(), created_at: "" },
  { id: "6", pubkey: "", name: "SAGE", role: "oracle", status: "active", uptime: 99.8, last_active: new Date().toISOString(), created_at: "" },
];

// Calculate uptime based on last_active timestamp
function calculateUptime(lastActive: string): number {
  if (!lastActive) return 95.0;

  const lastActiveTime = new Date(lastActive).getTime();
  const now = Date.now();
  const minutesInactive = (now - lastActiveTime) / (1000 * 60);

  // Base uptime decreases by 0.1% per minute of inactivity
  // Active within 2 min = 99.9%, caps at 95% minimum
  const uptime = Math.max(95, 99.9 - (minutesInactive * 0.05));
  return uptime;
}

function AgentCard({ agent }: { agent: Agent }) {
  // Fallback agents (no pubkey) always show high uptime with small fluctuations
  const isFallback = !agent.pubkey;
  const [uptime, setUptime] = useState(() =>
    isFallback ? 99.5 + Math.random() * 0.4 : calculateUptime(agent.last_active)
  );

  // Recalculate uptime based on last_active, with small fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFallback) {
        // Fallback agents: simulate stable high uptime (99.3 - 99.9)
        setUptime(99.3 + Math.random() * 0.6);
      } else {
        const baseUptime = calculateUptime(agent.last_active);
        // Add small random fluctuation for visual effect
        const delta = (Math.random() - 0.5) * 0.2;
        setUptime(Math.min(99.99, Math.max(95, baseUptime + delta)));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [agent.last_active, isFallback]);

  // Get display info for this agent role
  const info = AGENT_INFO[agent.role] || { displayName: agent.name, description: agent.role };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="relative">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            uptime >= 50 ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {uptime >= 50 && (
          <div className="absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-green-500 opacity-75" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-primary">{info.displayName}</span>
          <span className="text-xs text-muted-foreground">{info.description}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Uptime: <span className="font-medium tabular-nums">{uptime.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function AgentNetwork() {
  const { agents, loading } = useAgents();
  const displayAgents = agents.length > 0 ? agents : getFallbackAgents();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span className="text-primary">◆</span>
          KLOD NETWORK STATUS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {displayAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
