"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Agent {
  id: string;
  pubkey: string;
  name: string;
  role: string;
  status: "active" | "idle" | "offline";
  uptime: number;
  last_active: string;
  created_at: string;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at");

      if (data && !error) {
        setAgents(data);
      }
      setLoading(false);
    };

    fetchAgents();

    // Real-time subscription
    const channel = supabase
      .channel("agents-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setAgents((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? (payload.new as Agent) : a
              )
            );
          } else if (payload.eventType === "INSERT") {
            setAgents((prev) => [...prev, payload.new as Agent]);
          } else if (payload.eventType === "DELETE") {
            setAgents((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { agents, loading };
}
