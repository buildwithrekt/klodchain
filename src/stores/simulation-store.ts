"use client";

import { create } from "zustand";
import type { Block, Transaction, Validator, Account } from "@/types";
import {
  SimulationEngine,
  getEngine,
  resetEngine,
  type SimulationEvent,
} from "@/lib/simulation/engine";
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
  accounts: Map<string, Account>;

  // Actions
  initialize: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => Promise<void>;
  setSpeed: (speed: number) => void;
  advanceOneSlot: () => Promise<void>;
  addTransaction: (tx: Transaction) => void;

  // Internal
  _engine: SimulationEngine | null;
  _unsubscribe: (() => void) | null;
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
  accounts: new Map(),

  _engine: null,
  _unsubscribe: null,

  initialize: async () => {
    const { _engine, _unsubscribe } = get();

    // Clean up existing subscription
    if (_unsubscribe) {
      _unsubscribe();
    }

    const engine = _engine || getEngine();
    await engine.initialize();

    const state = engine.getState();

    // Subscribe to events
    const unsubscribe = engine.on((event: SimulationEvent) => {
      const currentState = get();

      switch (event.type) {
        case "block": {
          const block = event.data as Block;
          set({
            blocks: [...currentState.blocks, block],
            recentBlocks: [block, ...currentState.recentBlocks].slice(0, 50),
            currentSlot: block.slot + 1,
          });
          break;
        }
        case "transaction": {
          const tx = event.data as Transaction;
          set({
            transactions: [...currentState.transactions, tx],
            recentTransactions: [tx, ...currentState.recentTransactions].slice(0, 100),
          });
          break;
        }
        case "account": {
          const account = event.data as Account;
          const newAccounts = new Map(currentState.accounts);
          newAccounts.set(account.pubkey, account);
          set({ accounts: newAccounts });
          break;
        }
        case "epoch": {
          const epochData = event.data as { epoch_number: number };
          set({ currentEpoch: epochData.epoch_number });
          break;
        }
        case "stats": {
          const stats = event.data as { tps: number };
          set({ tps: stats.tps });
          break;
        }
      }
    });

    set({
      _engine: engine,
      _unsubscribe: unsubscribe,
      isInitialized: true,
      blocks: state.blocks,
      recentBlocks: state.blocks.slice(-50).reverse(),
      validators: state.validators,
      accounts: state.accounts,
      currentSlot: state.currentSlot,
      currentEpoch: state.currentEpoch,
    });
  },

  start: async () => {
    const { _engine, isInitialized } = get();

    if (!isInitialized) {
      await get().initialize();
    }

    const engine = get()._engine || getEngine();
    await engine.start();
    set({ isRunning: true });
  },

  stop: () => {
    const { _engine } = get();
    if (_engine) {
      _engine.stop();
    }
    set({ isRunning: false });
  },

  reset: async () => {
    const { _unsubscribe } = get();

    if (_unsubscribe) {
      _unsubscribe();
    }

    resetEngine();

    set({
      isRunning: false,
      isInitialized: false,
      currentSlot: 0,
      currentEpoch: 0,
      tps: 0,
      blocks: [],
      recentBlocks: [],
      transactions: [],
      recentTransactions: [],
      validators: [],
      accounts: new Map(),
      _engine: null,
      _unsubscribe: null,
    });

    await get().initialize();
  },

  setSpeed: (speed: number) => {
    const { _engine } = get();
    if (_engine) {
      _engine.setSpeed(speed);
    }
    set({ speed });
  },

  advanceOneSlot: async () => {
    const { _engine, isInitialized } = get();

    if (!isInitialized) {
      await get().initialize();
    }

    const engine = get()._engine || getEngine();
    await engine.advanceOneSlot();
  },

  addTransaction: (tx: Transaction) => {
    const { _engine } = get();
    if (_engine) {
      _engine.addTransaction(tx);
    }
  },
}));
