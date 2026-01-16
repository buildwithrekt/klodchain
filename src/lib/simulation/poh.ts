// Proof of History simulation
// In real Solana, this is a sequential hash chain proving passage of time

import { sha256 } from "../crypto/hash";

export interface PoHEntry {
  hash: string;
  slot: number;
  numHashes: number;
}

let currentHash =
  "0000000000000000000000000000000000000000000000000000000000000000";
let hashCount = 0;

export function resetPoH(initialHash?: string): void {
  currentHash =
    initialHash ||
    "0000000000000000000000000000000000000000000000000000000000000000";
  hashCount = 0;
}

export async function tickPoH(count: number = 1): Promise<string> {
  for (let i = 0; i < count; i++) {
    currentHash = await sha256(currentHash);
    hashCount++;
  }
  return currentHash;
}

export async function mixInData(data: string): Promise<string> {
  currentHash = await sha256(`${currentHash}:${data}`);
  hashCount++;
  return currentHash;
}

export async function generatePoHForSlot(
  slot: number,
  transactionData: string = ""
): Promise<PoHEntry> {
  // Simulate multiple PoH ticks per slot (simplified)
  const ticksPerSlot = 64;
  await tickPoH(ticksPerSlot - 1);

  // Mix in transaction data at the end of the slot
  if (transactionData) {
    await mixInData(transactionData);
  } else {
    await tickPoH(1);
  }

  return {
    hash: currentHash,
    slot,
    numHashes: hashCount,
  };
}

export function getCurrentHash(): string {
  return currentHash;
}

export function getHashCount(): number {
  return hashCount;
}
