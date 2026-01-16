// Block production logic

import type { Block, Transaction, Validator } from "@/types";
import { SOLANA_CONSTANTS } from "../utils/constants";
import { hashBlock, generateRandomHash } from "../crypto/hash";
import { generatePoHForSlot, getCurrentHash, resetPoH } from "./poh";
import {
  processTransactionBatch,
  type TransactionResult,
} from "./transaction-processor";
import type { Account } from "@/types";

export interface BlockProductionConfig {
  slotDuration: number;
  maxTransactionsPerBlock: number;
}

export interface BlockProductionResult {
  block: Block;
  processedTransactions: TransactionResult[];
  accountUpdates: Map<string, Account>;
}

let previousBlock: Block | null = null;

export function setPreviousBlock(block: Block | null): void {
  previousBlock = block;
}

export function getPreviousBlock(): Block | null {
  return previousBlock;
}

export async function produceBlock(
  slot: number,
  leaderPubkey: string,
  pendingTransactions: Transaction[],
  accounts: Map<string, Account>,
  config: BlockProductionConfig = {
    slotDuration: SOLANA_CONSTANTS.DEFAULT_SLOT_DURATION_MS,
    maxTransactionsPerBlock: SOLANA_CONSTANTS.MAX_TX_PER_BLOCK,
  }
): Promise<BlockProductionResult> {
  // Limit transactions per block
  const txsToProcess = pendingTransactions.slice(
    0,
    config.maxTransactionsPerBlock
  );

  // Process transactions
  const processedResults = processTransactionBatch(txsToProcess, accounts);

  // Collect successful transactions
  const confirmedTxs = processedResults.filter((r) => r.success);
  const txSignatures = confirmedTxs.map((r) => r.transaction.signature);

  // Generate PoH for this slot
  const pohEntry = await generatePoHForSlot(slot, txSignatures.join(","));

  // Generate block hash
  const blockhash = await hashBlock(slot, pohEntry.hash, txSignatures);

  // Collect all account updates
  const allAccountUpdates = new Map<string, Account>();
  for (const result of processedResults) {
    if (result.accountUpdates) {
      for (const [pubkey, account] of result.accountUpdates) {
        allAccountUpdates.set(pubkey, account);
      }
    }
  }

  // Create block
  const block: Block = {
    id: crypto.randomUUID(),
    slot,
    parent_slot: previousBlock?.slot ?? null,
    blockhash,
    previous_blockhash: previousBlock?.blockhash ?? null,
    leader_pubkey: leaderPubkey,
    transaction_count: confirmedTxs.length,
    timestamp: new Date().toISOString(),
    poh_hash: pohEntry.hash,
  };

  // Update processed transactions with slot info
  const processedTransactions = processedResults.map((result, index) => ({
    ...result,
    transaction: {
      ...result.transaction,
      slot: result.success ? slot : null,
      block_index: result.success ? index : null,
    },
  }));

  // Update previous block reference
  previousBlock = block;

  return {
    block,
    processedTransactions,
    accountUpdates: allAccountUpdates,
  };
}

export function createGenesisBlock(leaderPubkey: string): Block {
  resetPoH();

  const block: Block = {
    id: crypto.randomUUID(),
    slot: 0,
    parent_slot: null,
    blockhash: generateRandomHash(),
    previous_blockhash: null,
    leader_pubkey: leaderPubkey,
    transaction_count: 0,
    timestamp: new Date().toISOString(),
    poh_hash: getCurrentHash(),
  };

  previousBlock = block;
  return block;
}
