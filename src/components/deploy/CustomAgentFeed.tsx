"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Sparkles,
  RefreshCw,
  Eye,
  Flame,
  Compass,
  FlaskConical,
  Lock,
  Gem,
  Link2,
  Ghost,
  Radar,
  ScrollText,
  Anchor,
} from "lucide-react";
import { CustomAgent, AgentSymbol, AGENT_CLASSES } from "@/types/custom-agent";
import {
  getActiveAgents,
  getAgentApiKey,
  incrementAgentInteractions,
} from "@/lib/agents/storage";

const SYMBOL_ICONS: Record<AgentSymbol, React.ReactNode> = {
  eye: <Eye className="h-4 w-4" />,
  flame: <Flame className="h-4 w-4" />,
  compass: <Compass className="h-4 w-4" />,
  flask: <FlaskConical className="h-4 w-4" />,
  lock: <Lock className="h-4 w-4" />,
  crystal: <Gem className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  ghost: <Ghost className="h-4 w-4" />,
  radar: <Radar className="h-4 w-4" />,
  scroll: <ScrollText className="h-4 w-4" />,
  anchor: <Anchor className="h-4 w-4" />,
  prism: <Sparkles className="h-4 w-4" />,
};

interface AgentThought {
  id: string;
  agentId: string;
  agentName: string;
  agentClass: string;
  agentSymbol: AgentSymbol;
  thought: string;
  context: {
    slot?: number;
    tps?: number;
  };
  createdAt: string;
}

export function CustomAgentFeed() {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [activeAgents, setActiveAgents] = useState<CustomAgent[]>([]);

  useEffect(() => {
    setActiveAgents(getActiveAgents());
    setLoading(false);
  }, []);

  const triggerThought = useCallback(async () => {
    const agents = getActiveAgents();
    if (agents.length === 0) return;

    setIsThinking(true);

    const agent = agents[Math.floor(Math.random() * agents.length)];
    const apiKey = getAgentApiKey(agent.id);

    if (!apiKey) {
      setIsThinking(false);
      return;
    }

    try {
      const response = await fetch("/api/agents/custom-think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();

        const newThought: AgentThought = {
          id: `thought_${Date.now()}`,
          agentId: agent.id,
          agentName: agent.name,
          agentClass: AGENT_CLASSES[agent.agentClass].label,
          agentSymbol: agent.symbol,
          thought: data.thought,
          context: data.context,
          createdAt: new Date().toISOString(),
        };

        setThoughts((prev) => [newThought, ...prev.slice(0, 19)]);
        incrementAgentInteractions(agent.id);
      }
    } catch (error) {
      console.error("Failed to generate agent thought:", error);
    }

    setIsThinking(false);
  }, []);

  useEffect(() => {
    if (activeAgents.length === 0) return;

    const initialTimeout = setTimeout(triggerThought, 8000);
    const interval = setInterval(triggerThought, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [activeAgents.length, triggerThought]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Brain className="animate-pulse h-4 w-4 text-primary" />
            Live Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeAgents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Ghost className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No active agents
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {isThinking && (
            <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
          )}
          <span className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={triggerThought}
            disabled={isThinking}
          >
            <RefreshCw className={`h-3 w-3 ${isThinking ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {thoughts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Waiting for thoughts...
                </p>
              </div>
            ) : (
              thoughts.map((thought) => (
                <div
                  key={thought.id}
                  className="rounded-lg border bg-card/50 p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary">
                      {SYMBOL_ICONS[thought.agentSymbol]}
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        Object.values(AGENT_CLASSES).find(
                          (c) => c.label === thought.agentClass
                        )?.color || "text-primary"
                      }`}
                    >
                      {thought.agentName}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {thought.agentClass}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatTimeAgo(thought.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {thought.thought}
                  </p>
                  {thought.context?.slot && (
                    <p className="text-[10px] text-muted-foreground">
                      slot #{thought.context.slot.toLocaleString()}
                      {thought.context.tps !== undefined && ` · ${thought.context.tps} TPS`}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}
