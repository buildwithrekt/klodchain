"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents, type Agent } from "@/hooks/useAgents";

// Fallback agents for when DB is empty
const FALLBACK_AGENTS: Agent[] = [
  { id: "1", pubkey: "", name: "KLOD Validator", role: "validator", status: "active", uptime: 99.9, last_active: "", created_at: "" },
  { id: "2", pubkey: "", name: "KLOD Architect", role: "architect", status: "active", uptime: 99.8, last_active: "", created_at: "" },
  { id: "3", pubkey: "", name: "KLOD Analyst", role: "analyst", status: "active", uptime: 99.9, last_active: "", created_at: "" },
  { id: "4", pubkey: "", name: "KLOD Reviewer", role: "reviewer", status: "active", uptime: 99.7, last_active: "", created_at: "" },
  { id: "5", pubkey: "", name: "KLOD Consensus", role: "consensus", status: "active", uptime: 99.9, last_active: "", created_at: "" },
  { id: "6", pubkey: "", name: "KLOD Oracle", role: "oracle", status: "active", uptime: 99.8, last_active: "", created_at: "" },
];

function AgentCard({ agent }: { agent: Agent }) {
  const [uptime, setUptime] = useState(agent.uptime);

  // Simulate small uptime fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => {
        const delta = (Math.random() - 0.5) * 0.1;
        return Math.min(100, Math.max(99, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [agent.uptime]);

  // Extract display name (e.g., "KLOD Validator" -> "KLOD" and "Validator")
  const nameParts = agent.name.split(" ");
  const prefix = nameParts[0];
  const role = nameParts.slice(1).join(" ") || agent.role;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="relative">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            agent.status === "active"
              ? "bg-green-500"
              : agent.status === "idle"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        {agent.status === "active" && (
          <div className="absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-green-500 opacity-75" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-primary">{prefix}</span>
          <span className="font-medium capitalize">{role}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="uppercase">
            {agent.status === "active" ? "Active" : agent.status}
          </span>
          <span className="mx-1">|</span>
          <span>Uptime: {uptime.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function AgentNetwork() {
  const { agents, loading } = useAgents();
  const displayAgents = agents.length > 0 ? agents : FALLBACK_AGENTS;

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
