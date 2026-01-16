"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Validator } from "@/types";

export function useValidators() {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchValidators = async () => {
      const { data, error } = await supabase
        .from("validators")
        .select("*")
        .order("stake", { ascending: false });

      if (data && !error) {
        setValidators(data);
      }
      setLoading(false);
    };

    fetchValidators();

    // Real-time subscription
    const channel = supabase
      .channel("validators-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "validators" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setValidators((prev) =>
              prev.map((v) =>
                v.id === payload.new.id ? (payload.new as Validator) : v
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { validators, loading };
}
