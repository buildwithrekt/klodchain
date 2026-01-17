"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Brain, Sparkles } from "lucide-react";

interface AgentLog {
  id: string;
  agent_name: string;
  agent_role: string;
  message: string;
  context: {
    slot?: number;
    tps?: number;
  };
  created_at: string;
}

const AGENT_COLORS: Record<string, string> = {
  VEX: "text-cyan-400",
  ARC: "text-purple-400",
  SCAN: "text-emerald-400",
  FLUX: "text-orange-400",
  SYNC: "text-blue-400",
  SAGE: "text-yellow-400",
};

const ROLE_BADGES: Record<string, string> = {
  "Block Producer": "bg-cyan-500/20 text-cyan-400",
  "Network Design": "bg-purple-500/20 text-purple-400",
  "Chain Monitor": "bg-emerald-500/20 text-emerald-400",
  "TX Processor": "bg-orange-500/20 text-orange-400",
  "Consensus": "bg-blue-500/20 text-blue-400",
  "Data Oracle": "bg-yellow-500/20 text-yellow-400",
};

function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AgentFeed() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch initial logs
  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && !error) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();

    // Subscribe to new logs
    const channel = supabase
      .channel("agent-logs-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as AgentLog, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Trigger agent thinking at interval
  useEffect(() => {
    const triggerThought = async () => {
      setIsThinking(true);
      try {
        await fetch("/api/agents/think", { method: "POST" });
      } catch (error) {
        console.error("Failed to trigger agent thought:", error);
      }
      setIsThinking(false);
    };

    // Initial thought after 2 minutes
    const initialTimeout = setTimeout(triggerThought, 120000);

    // Then every 30 minutes
    const interval = setInterval(triggerThought, 1800000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Brain className="animate-pulse h-4 w-4 text-primary" />
            AGENT WORKFORCE
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
        <Brain className="animate-pulse h-4 w-4 text-primary" />
        AGENTS WORKFORCE
          {isThinking && (
            <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]" ref={scrollRef}>
          <div className="space-y-1 p-4 pt-0">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Agents are warming up...
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border bg-card/50 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm ${
                          AGENT_COLORS[log.agent_name] || "text-primary"
                        }`}
                      >
                        {log.agent_name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          ROLE_BADGES[log.agent_role] || ""
                        }`}
                      >
                        {log.agent_role}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {log.message}
                  </p>
                  {log.context?.slot && (
                    <p className="text-[10px] text-muted-foreground">
                      @ slot #{log.context.slot.toLocaleString()}
                      {log.context.tps !== undefined && ` · ${log.context.tps} TPS`}
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
