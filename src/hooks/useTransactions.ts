"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction } from "@/types";

export function useTransactions(limit: number = 100) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (data && !error) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();

    // Real-time subscription
    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTransactions((prev) =>
              [payload.new as Transaction, ...prev].slice(0, limit)
            );
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((tx) =>
                tx.id === payload.new.id ? (payload.new as Transaction) : tx
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, limit]);

  return { transactions, loading };
}
