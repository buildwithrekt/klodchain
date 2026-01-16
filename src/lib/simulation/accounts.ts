// Account state management

import type { Account } from "@/types";
import { SOLANA_CONSTANTS } from "../utils/constants";
import { generatePubkey } from "../crypto/keypair";

export interface AccountUpdate {
  pubkey: string;
  lamportsDelta?: number;
  newLamports?: number;
  data?: Record<string, unknown>;
}

export function createAccount(
  pubkey: string,
  lamports: number = 0,
  owner: string = SOLANA_CONSTANTS.SYSTEM_PROGRAM_ID
): Account {
  return {
    pubkey,
    owner,
    lamports,
    data: {},
    executable: false,
    rent_epoch: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function createNewAccount(lamports: number = 0): Account {
  return createAccount(generatePubkey(), lamports);
}

export function applyTransfer(
  from: Account,
  to: Account,
  amount: number,
  fee: number = SOLANA_CONSTANTS.BASE_FEE_LAMPORTS
): { from: Account; to: Account } | { error: string } {
  const totalDebit = amount + fee;

  if (from.lamports < totalDebit) {
    return { error: "Insufficient balance" };
  }

  return {
    from: {
      ...from,
      lamports: from.lamports - totalDebit,
      updated_at: new Date().toISOString(),
    },
    to: {
      ...to,
      lamports: to.lamports + amount,
      updated_at: new Date().toISOString(),
    },
  };
}

export function canAfford(
  account: Account,
  amount: number,
  fee: number = SOLANA_CONSTANTS.BASE_FEE_LAMPORTS
): boolean {
  return account.lamports >= amount + fee;
}

export function isRentExempt(lamports: number, dataSize: number = 0): boolean {
  // Simplified rent calculation
  const minBalance =
    SOLANA_CONSTANTS.RENT_EXEMPT_MINIMUM + dataSize * 6960; // ~6960 lamports per byte
  return lamports >= minBalance;
}

// Generate initial accounts for simulation
export function generateInitialAccounts(count: number = 10): Account[] {
  const accounts: Account[] = [];

  for (let i = 0; i < count; i++) {
    const lamports = Math.floor(Math.random() * 100) * SOLANA_CONSTANTS.LAMPORTS_PER_KLOD;
    accounts.push(createNewAccount(lamports));
  }

  return accounts;
}
