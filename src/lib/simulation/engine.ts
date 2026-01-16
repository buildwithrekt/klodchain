// Core simulation engine

import type { Block, Transaction, Validator, Account, Epoch } from "@/types";
import { SOLANA_CONSTANTS } from "../utils/constants";
import {
  produceBlock,
  createGenesisBlock,
  setPreviousBlock,
} from "./block-producer";
import {
  generateLeaderSchedule,
  getLeaderForSlot,
  getEpochForSlot,
  type LeaderSchedule,
} from "./leader-schedule";
import { resetPoH } from "./poh";
import { AGENT_KEYPAIRS } from "../crypto/keypair";

export interface SimulationConfig {
  slotDuration: number;
  maxTransactionsPerBlock: number;
  autoGenerateTransactions: boolean;
  transactionsPerSlot: number;
}

export interface SimulationState {
  isRunning: boolean;
  currentSlot: number;
  currentEpoch: number;
  speed: number;
  blocks: Block[];
  transactions: Transaction[];
  accounts: Map<string, Account>;
  validators: Validator[];
  leaderSchedule: LeaderSchedule | null;
  pendingTransactions: Transaction[];
  tps: number;
  recentTxCount: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  slotDuration: SOLANA_CONSTANTS.DEFAULT_SLOT_DURATION_MS,
  maxTransactionsPerBlock: SOLANA_CONSTANTS.MAX_TX_PER_BLOCK,
  autoGenerateTransactions: true,
  transactionsPerSlot: 5,
};

export type SimulationEventType =
  | "block"
  | "transaction"
  | "account"
  | "epoch"
  | "stats";

export interface SimulationEvent {
  type: SimulationEventType;
  data: Block | Transaction | Account | Epoch | { tps: number };
}

export type SimulationEventHandler = (event: SimulationEvent) => void;

export class SimulationEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private config: SimulationConfig;
  private state: SimulationState;
  private eventHandlers: Set<SimulationEventHandler> = new Set();
  private txTimestamps: number[] = [];

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): SimulationState {
    return {
      isRunning: false,
      currentSlot: 0,
      currentEpoch: 0,
      speed: 1,
      blocks: [],
      transactions: [],
      accounts: new Map(),
      validators: [],
      leaderSchedule: null,
      pendingTransactions: [],
      tps: 0,
      recentTxCount: 0,
    };
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  public on(handler: SimulationEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: SimulationEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  public async initialize(): Promise<void> {
    // Reset state
    this.state = this.createInitialState();
    resetPoH();

    // Create initial validators
    this.state.validators = this.createInitialValidators();

    // Create initial accounts (from validators + random accounts)
    this.state.accounts = this.createInitialAccounts();

    // Generate first epoch's leader schedule
    this.state.leaderSchedule = generateLeaderSchedule(0, this.state.validators);

    // Create genesis block
    const genesisLeader = getLeaderForSlot(0, this.state.leaderSchedule);
    if (genesisLeader) {
      const genesisBlock = createGenesisBlock(genesisLeader);
      this.state.blocks.push(genesisBlock);
      this.emit({ type: "block", data: genesisBlock });
    }
  }

  private createInitialValidators(): Validator[] {
    return AGENT_KEYPAIRS.map((agent) => ({
      id: crypto.randomUUID(),
      pubkey: agent.pubkey,
      name: agent.name,
      stake: Math.floor((Math.random() * 900 + 100) * SOLANA_CONSTANTS.LAMPORTS_PER_KLOD),
      blocks_produced: 0,
      skip_rate: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    }));
  }

  private createInitialAccounts(): Map<string, Account> {
    const accounts = new Map<string, Account>();

    // Add validator accounts
    for (const validator of this.state.validators) {
      accounts.set(validator.pubkey, {
        pubkey: validator.pubkey,
        owner: SOLANA_CONSTANTS.SYSTEM_PROGRAM_ID,
        lamports: validator.stake,
        data: {},
        executable: false,
        rent_epoch: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Add some user accounts
    for (let i = 0; i < 20; i++) {
      const pubkey = `User${String(i + 1).padStart(3, "0")}${"1".repeat(39)}`;
      accounts.set(pubkey, {
        pubkey,
        owner: SOLANA_CONSTANTS.SYSTEM_PROGRAM_ID,
        lamports: Math.floor(Math.random() * 100) * SOLANA_CONSTANTS.LAMPORTS_PER_KLOD,
        data: {},
        executable: false,
        rent_epoch: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return accounts;
  }

  public async start(): Promise<void> {
    if (this.state.isRunning) return;

    if (this.state.blocks.length === 0) {
      await this.initialize();
    }

    this.state.isRunning = true;
    this.state.currentSlot = this.state.blocks.length;

    const effectiveSlotDuration = this.config.slotDuration / this.state.speed;

    this.intervalId = setInterval(async () => {
      await this.tick();
    }, effectiveSlotDuration);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state.isRunning = false;
  }

  public setSpeed(speed: number): void {
    this.state.speed = speed;
    if (this.state.isRunning) {
      this.stop();
      this.start();
    }
  }

  public async reset(): Promise<void> {
    this.stop();
    await this.initialize();
  }

  public addTransaction(tx: Transaction): void {
    this.state.pendingTransactions.push(tx);
  }

  private async tick(): Promise<void> {
    const slot = this.state.currentSlot;

    // Check for epoch transition
    const epoch = getEpochForSlot(slot);
    if (epoch !== this.state.currentEpoch) {
      this.state.currentEpoch = epoch;
      this.state.leaderSchedule = generateLeaderSchedule(
        epoch,
        this.state.validators
      );
      this.emit({
        type: "epoch",
        data: {
          epoch_number: epoch,
          start_slot: epoch * SOLANA_CONSTANTS.SLOTS_PER_EPOCH,
          end_slot: (epoch + 1) * SOLANA_CONSTANTS.SLOTS_PER_EPOCH - 1,
          leader_schedule: this.state.leaderSchedule.schedule,
          started_at: new Date().toISOString(),
          completed_at: null,
        },
      });
    }

    // Get leader for this slot
    const leader = this.state.leaderSchedule
      ? getLeaderForSlot(slot, this.state.leaderSchedule)
      : null;

    if (!leader) {
      console.error("No leader for slot", slot);
      this.state.currentSlot++;
      return;
    }

    // Auto-generate some transactions
    if (this.config.autoGenerateTransactions) {
      const newTxs = this.generateRandomTransactions();
      this.state.pendingTransactions.push(...newTxs);
    }

    // Produce block
    const result = await produceBlock(
      slot,
      leader,
      this.state.pendingTransactions,
      this.state.accounts,
      {
        slotDuration: this.config.slotDuration,
        maxTransactionsPerBlock: this.config.maxTransactionsPerBlock,
      }
    );

    // Update state
    this.state.blocks.push(result.block);

    // Update validator stats
    const validator = this.state.validators.find((v) => v.pubkey === leader);
    if (validator) {
      validator.blocks_produced++;
    }

    // Update accounts
    for (const [pubkey, account] of result.accountUpdates) {
      this.state.accounts.set(pubkey, account);
      this.emit({ type: "account", data: account });
    }

    // Update transactions
    const confirmedTxs = result.processedTransactions
      .filter((r) => r.success)
      .map((r) => r.transaction);

    this.state.transactions.push(...confirmedTxs);
    for (const tx of confirmedTxs) {
      this.emit({ type: "transaction", data: tx });
    }

    // Remove processed transactions from pending
    const processedSignatures = new Set(
      result.processedTransactions.map((r) => r.transaction.signature)
    );
    this.state.pendingTransactions = this.state.pendingTransactions.filter(
      (tx) => !processedSignatures.has(tx.signature)
    );

    // Calculate TPS
    this.updateTps(confirmedTxs.length);

    // Emit block event
    this.emit({ type: "block", data: result.block });
    this.emit({ type: "stats", data: { tps: this.state.tps } });

    this.state.currentSlot++;
  }

  private updateTps(txCount: number): void {
    const now = Date.now();
    this.txTimestamps.push(...Array(txCount).fill(now));

    // Keep only last 10 seconds
    const cutoff = now - 10000;
    this.txTimestamps = this.txTimestamps.filter((t) => t > cutoff);

    // Calculate TPS
    this.state.tps = this.txTimestamps.length / 10;
  }

  private generateRandomTransactions(): Transaction[] {
    const txs: Transaction[] = [];
    const accounts = Array.from(this.state.accounts.values()).filter(
      (a) => a.lamports > SOLANA_CONSTANTS.LAMPORTS_PER_KLOD
    );

    if (accounts.length < 2) return txs;

    const count = Math.floor(Math.random() * this.config.transactionsPerSlot) + 1;

    for (let i = 0; i < count; i++) {
      const fromIdx = Math.floor(Math.random() * accounts.length);
      let toIdx = Math.floor(Math.random() * accounts.length);
      while (toIdx === fromIdx) {
        toIdx = Math.floor(Math.random() * accounts.length);
      }

      const from = accounts[fromIdx];
      const to = accounts[toIdx];
      const maxAmount = Math.floor(from.lamports / 10);
      const amount = Math.floor(Math.random() * maxAmount) + 1000;

      const tx: Transaction = {
        id: crypto.randomUUID(),
        signature: `Sig${Date.now()}${Math.random().toString(36).substring(2, 15)}`,
        slot: null,
        block_index: null,
        fee: SOLANA_CONSTANTS.BASE_FEE_LAMPORTS,
        status: "pending",
        transaction_type: "transfer",
        from_pubkey: from.pubkey,
        to_pubkey: to.pubkey,
        amount,
        program_id: null,
        instruction_data: null,
        created_at: new Date().toISOString(),
        confirmed_at: null,
      };

      txs.push(tx);
    }

    return txs;
  }

  public async advanceOneSlot(): Promise<Block | null> {
    if (this.state.isRunning) return null;

    if (this.state.blocks.length === 0) {
      await this.initialize();
    }

    this.state.currentSlot = this.state.blocks.length;
    await this.tick();

    return this.state.blocks[this.state.blocks.length - 1] || null;
  }
}

// Singleton instance
let engineInstance: SimulationEngine | null = null;

export function getEngine(): SimulationEngine {
  if (!engineInstance) {
    engineInstance = new SimulationEngine();
  }
  return engineInstance;
}

export function resetEngine(): void {
  if (engineInstance) {
    engineInstance.stop();
  }
  engineInstance = new SimulationEngine();
}
