"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/stores/simulation-store";
import { formatTps } from "@/lib/utils/formatters";
import { createClient } from "@/lib/supabase/client";

const TPS_STORAGE_KEY = "klodchain_last_tps";

export function TpsCounter() {
  const { tps: storeTps, isInitialized } = useSimulationStore();
  const [displayTps, setDisplayTps] = useState<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // On mount, load last known TPS from localStorage
  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem(TPS_STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0) {
        setDisplayTps(parsed);
      }
    }
  }, []);

  // If store is not initialized, fetch TPS directly from database
  useEffect(() => {
    if (isInitialized) return; // Store handles it

    const fetchTps = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("network_stats")
          .select("tps")
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();

        if (data?.tps && data.tps > 0) {
          setDisplayTps(data.tps);
          localStorage.setItem(TPS_STORAGE_KEY, data.tps.toString());
        }
      } catch (e) {
        // Ignore errors, we have localStorage fallback
      }
    };

    fetchTps();

    // Subscribe to realtime updates
    const supabase = createClient();
    const channel = supabase
      .channel("tps-header")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "network_stats" },
        (payload) => {
          const newTps = (payload.new as { tps: number }).tps;
          if (newTps && newTps > 0) {
            setDisplayTps(newTps);
            localStorage.setItem(TPS_STORAGE_KEY, newTps.toString());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isInitialized]);

  // When store TPS updates, save to localStorage
  useEffect(() => {
    if (storeTps > 0) {
      setDisplayTps(storeTps);
      localStorage.setItem(TPS_STORAGE_KEY, storeTps.toString());
    }
  }, [storeTps]);

  // Use store TPS if available, otherwise use cached/fetched value
  const currentTps = storeTps > 0 ? storeTps : displayTps;

  // Prevent hydration mismatch - show nothing during SSR
  if (!hasMounted) {
    return (
      <div className="flex text-muted-foreground items-baseline gap-1">
        <span className="font-semibold text-xs tabular-nums">--</span>
        <span className="text-xs">tps</span>
      </div>
    );
  }

  // Show current TPS or placeholder
  if (currentTps === null || currentTps < 0.01) {
    return (
      <div className="flex text-muted-foreground items-baseline gap-1">
        <span className="font-semibold text-xs tabular-nums">--</span>
        <span className="text-xs">tps</span>
      </div>
    );
  }

  return (
    <div className="flex text-green-400 items-baseline gap-1">
      <span className="font-semibold text-xs tabular-nums">{formatTps(currentTps)}</span>
      <span className="text-xs">tps</span>
    </div>
  );
}
