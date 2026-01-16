import { SOLANA_CONSTANTS } from "./constants";

export function lamportsToKlod(lamports: number): number {
  return lamports / SOLANA_CONSTANTS.LAMPORTS_PER_KLOD;
}

export function klodToLamports(klod: number): number {
  return Math.floor(klod * SOLANA_CONSTANTS.LAMPORTS_PER_KLOD);
}

export function formatSol(lamports: number, decimals = 4): string {
  return lamportsToKlod(lamports).toFixed(decimals);
}

export function shortenPubkey(pubkey: string, chars = 4): string {
  if (pubkey.length <= chars * 2) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

export function shortenHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  }
  return num.toLocaleString();
}

export function formatTps(tps: number): string {
  return tps.toFixed(2);
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function formatSlot(slot: number): string {
  return slot.toLocaleString();
}

export function calculateEpochProgress(
  currentSlot: number,
  epochStartSlot: number
): number {
  const slotsInEpoch = currentSlot - epochStartSlot;
  return Math.min(
    (slotsInEpoch / SOLANA_CONSTANTS.SLOTS_PER_EPOCH) * 100,
    100
  );
}
