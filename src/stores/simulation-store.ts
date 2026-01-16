"use client";

import { create } from "zustand";
import type { Block, Transaction, Validator } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { SOLANA_CONSTANTS } from "@/lib/utils/constants";

interface SimulationStore {
  // State
  isRunning: boolean;
  isInitialized: boolean;
  currentSlot: number;
  currentEpoch: number;
  speed: number;
  tps: number;

  // Data
  blocks: Block[];
  recentBlocks: Block[];
  transactions: Transaction[];
  recentTransactions: Transaction[];
  validators: Validator[];

  // Actions
  initialize: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => Promise<void>;
  setSpeed: (speed: number) => void;
  advanceOneSlot: () => Promise<void>;

  // Internal
  _intervalId: NodeJS.Timeout | null;
  _cleanup: (() => void) | null;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  isRunning: false,
  isInitialized: false,
  currentSlot: 0,
  currentEpoch: 0,
  speed: 1,
  tps: 0,

  blocks: [],
  recentBlocks: [],
  transactions: [],
  recentTransactions: [],
  validators: [],

  _intervalId: null,
  _cleanup: null,

  initialize: async () => {
    const supabase = createClient();

    // Fetch initial data from Supabase
    const [blocksRes, txRes, validatorsRes, statsRes] = await Promise.all([
      supabase
        .from("blocks")
        .select("*")
        .order("slot", { ascending: false })
        .limit(50),
      supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("validators")
        .select("*")
        .order("stake", { ascending: false }),
      supabase
        .from("network_stats")
        .select("tps")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const blocks = blocksRes.data || [];
    const transactions = txRes.data || [];
    const validators = validatorsRes.data || [];
    const initialTps = statsRes.data?.tps || 0;
    const currentSlot = blocks.length > 0 ? blocks[0].slot + 1 : 0;

    // Subscribe to real-time updates
    const blocksChannel = supabase
      .channel("blocks-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "blocks" },
        (payload) => {
          const newBlock = payload.new as Block;
          const state = get();
          // Deduplicate by filtering out existing block with same id
          const filteredBlocks = state.blocks.filter((b) => b.id !== newBlock.id);
          const filteredRecent = state.recentBlocks.filter((b) => b.id !== newBlock.id);
          set({
            blocks: [newBlock, ...filteredBlocks].slice(0, 100),
            recentBlocks: [newBlock, ...filteredRecent].slice(0, 50),
            currentSlot: newBlock.slot + 1,
          });
        }
      )
      .subscribe();

    const txChannel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          const state = get();
          const newTx = payload.new as Transaction;
          if (payload.eventType === "INSERT") {
            // Deduplicate by filtering out existing tx with same id
            const filteredTxs = state.transactions.filter((tx) => tx.id !== newTx.id);
            const filteredRecent = state.recentTransactions.filter((tx) => tx.id !== newTx.id);
            set({
              transactions: [newTx, ...filteredTxs].slice(0, 200),
              recentTransactions: [newTx, ...filteredRecent].slice(0, 100),
            });
          } else if (payload.eventType === "UPDATE") {
            set({
              transactions: state.transactions.map((tx) =>
                tx.id === payload.new.id ? (payload.new as Transaction) : tx
              ),
              recentTransactions: state.recentTransactions.map((tx) =>
                tx.id === payload.new.id ? (payload.new as Transaction) : tx
              ),
            });
          }
        }
      )
      .subscribe();

    const validatorsChannel = supabase
      .channel("validators-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "validators" },
        (payload) => {
          const state = get();
          set({
            validators: state.validators.map((v) =>
              v.id === payload.new.id ? (payload.new as Validator) : v
            ),
          });
        }
      )
      .subscribe();

    // Subscribe to network_stats for TPS updates
    const statsChannel = supabase
      .channel("stats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "network_stats" },
        (payload) => {
          const newTps = (payload.new as { tps: number }).tps;
          if (newTps !== undefined) {
            set({ tps: newTps });
          }
        }
      )
      .subscribe();

    // Cleanup function
    const cleanup = () => {
      supabase.removeChannel(blocksChannel);
      supabase.removeChannel(txChannel);
      supabase.removeChannel(validatorsChannel);
      supabase.removeChannel(statsChannel);
    };

    set({
      isInitialized: true,
      blocks,
      recentBlocks: blocks.slice(0, 50),
      transactions,
      recentTransactions: transactions.slice(0, 100),
      validators,
      currentSlot,
      tps: initialTps,
      _cleanup: cleanup,
    });

    // Auto-start the simulation
    get().start();
  },

  start: async () => {
    const { isInitialized, _intervalId } = get();

    if (_intervalId) return; // Already running

    if (!isInitialized) {
      await get().initialize();
    }

    set({ isRunning: true });

    // TPS is now updated via Supabase realtime from network_stats
    // This interval is just for keeping isRunning state
    const intervalId = setInterval(() => {
      // Keep alive - TPS comes from server via realtime subscription
    }, 10000);

    set({ _intervalId: intervalId });
  },

  stop: () => {
    const { _intervalId } = get();
    if (_intervalId) {
      clearInterval(_intervalId);
    }
    set({ isRunning: false, _intervalId: null, tps: 0 });
  },

  reset: async () => {
    const { _intervalId, _cleanup } = get();

    if (_intervalId) {
      clearInterval(_intervalId);
    }
    if (_cleanup) {
      _cleanup();
    }

    set({
      isRunning: false,
      isInitialized: false,
      currentSlot: 0,
      currentEpoch: 0,
      speed: 1,
      tps: 0,
      blocks: [],
      recentBlocks: [],
      transactions: [],
      recentTransactions: [],
      validators: [],
      _intervalId: null,
      _cleanup: null,
    });

    await get().initialize();
  },

  setSpeed: (speed: number) => {
    const { isRunning } = get();
    set({ speed });

    if (isRunning) {
      // Restart with new speed
      get().stop();
      get().start();
    }
  },

  advanceOneSlot: async () => {
    const { isInitialized } = get();

    if (!isInitialized) {
      await get().initialize();
    }

    try {
      await fetch("/api/blockchain/produce-block", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to produce block:", error);
    }
  },
}));
