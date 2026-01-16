"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Block } from "@/types";

export function useBlocks(limit: number = 50) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlot, setCurrentSlot] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchBlocks = async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select("*")
        .order("slot", { ascending: false })
        .limit(limit);

      if (data && !error) {
        setBlocks(data);
        if (data.length > 0) {
          setCurrentSlot(data[0].slot);
        }
      }
      setLoading(false);
    };

    fetchBlocks();

    // Real-time subscription
    const channel = supabase
      .channel("blocks-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "blocks" },
        (payload) => {
          const newBlock = payload.new as Block;
          setBlocks((prev) => [newBlock, ...prev].slice(0, limit));
          setCurrentSlot(newBlock.slot);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, limit]);

  return { blocks, loading, currentSlot };
}
