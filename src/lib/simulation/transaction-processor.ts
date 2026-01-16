// Transaction validation and execution

import type { Transaction, Account } from "@/types";
import { SOLANA_CONSTANTS } from "../utils/constants";
import { generateSignature } from "../crypto/keypair";
import { applyTransfer, canAfford } from "./accounts";

export interface TransactionInput {
  type: "transfer" | "create_account" | "program_call";
  fromPubkey: string;
  toPubkey?: string;
  amount?: number;
  programId?: string;
  instructionData?: Record<string, unknown>;
  priorityFee?: number;
}

export interface ProcessedTransaction extends Transaction {
  accountUpdates: Map<string, Account>;
}

export interface TransactionResult {
  transaction: Transaction;
  success: boolean;
  error?: string;
  accountUpdates?: Map<string, Account>;
}

export function createTransaction(input: TransactionInput): Transaction {
  const fee = SOLANA_CONSTANTS.BASE_FEE_LAMPORTS + (input.priorityFee || 0);

  return {
    id: crypto.randomUUID(),
    signature: generateSignature(),
    slot: null,
    block_index: null,
    fee,
    status: "pending",
    transaction_type: input.type,
    from_pubkey: input.fromPubkey,
    to_pubkey: input.toPubkey || null,
    amount: input.amount || null,
    program_id: input.programId || null,
    instruction_data: input.instructionData || null,
    created_at: new Date().toISOString(),
    confirmed_at: null,
  };
}

export function validateTransaction(
  tx: Transaction,
  accounts: Map<string, Account>
): { valid: boolean; error?: string } {
  const fromAccount = accounts.get(tx.from_pubkey);

  if (!fromAccount) {
    return { valid: false, error: "From account not found" };
  }

  const totalRequired = (tx.amount || 0) + tx.fee;
  if (!canAfford(fromAccount, tx.amount || 0, tx.fee)) {
    return {
      valid: false,
      error: `Insufficient balance: has ${fromAccount.lamports}, needs ${totalRequired}`,
    };
  }

  if (tx.transaction_type === "transfer") {
    if (!tx.to_pubkey) {
      return { valid: false, error: "Transfer requires destination" };
    }
    if (tx.amount === null || tx.amount <= 0) {
      return { valid: false, error: "Transfer requires positive amount" };
    }
  }

  return { valid: true };
}

export function processTransaction(
  tx: Transaction,
  accounts: Map<string, Account>
): TransactionResult {
  const validation = validateTransaction(tx, accounts);

  if (!validation.valid) {
    return {
      transaction: { ...tx, status: "failed" },
      success: false,
      error: validation.error,
    };
  }

  const accountUpdates = new Map<string, Account>();

  if (tx.transaction_type === "transfer" && tx.to_pubkey && tx.amount) {
    const fromAccount = accounts.get(tx.from_pubkey)!;
    let toAccount = accounts.get(tx.to_pubkey);

    // Create destination account if it doesn't exist
    if (!toAccount) {
      toAccount = {
        pubkey: tx.to_pubkey,
        owner: SOLANA_CONSTANTS.SYSTEM_PROGRAM_ID,
        lamports: 0,
        data: {},
        executable: false,
        rent_epoch: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const result = applyTransfer(fromAccount, toAccount, tx.amount, tx.fee);

    if ("error" in result) {
      return {
        transaction: { ...tx, status: "failed" },
        success: false,
        error: result.error,
      };
    }

    accountUpdates.set(tx.from_pubkey, result.from);
    accountUpdates.set(tx.to_pubkey, result.to);
  }

  return {
    transaction: {
      ...tx,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    },
    success: true,
    accountUpdates,
  };
}

export function processTransactionBatch(
  transactions: Transaction[],
  accounts: Map<string, Account>
): TransactionResult[] {
  const results: TransactionResult[] = [];
  const workingAccounts = new Map(accounts);

  // Sort by fee (priority) - higher fee first
  const sortedTxs = [...transactions].sort((a, b) => b.fee - a.fee);

  for (const tx of sortedTxs) {
    const result = processTransaction(tx, workingAccounts);
    results.push(result);

    // Apply account updates to working state for next transaction
    if (result.accountUpdates) {
      for (const [pubkey, account] of result.accountUpdates) {
        workingAccounts.set(pubkey, account);
      }
    }
  }

  return results;
}
