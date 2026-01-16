// Leader schedule generation based on stake weight

import type { Validator } from "@/types";
import { SOLANA_CONSTANTS } from "../utils/constants";

export interface LeaderSchedule {
  epochNumber: number;
  startSlot: number;
  endSlot: number;
  schedule: Record<number, string>; // slot -> validator pubkey
}

// Weight selection based on stake
function weightedRandomSelect(
  validators: Validator[],
  totalStake: number
): Validator {
  const random = Math.random() * totalStake;
  let cumulative = 0;

  for (const validator of validators) {
    cumulative += validator.stake;
    if (random <= cumulative) {
      return validator;
    }
  }

  // Fallback to last validator
  return validators[validators.length - 1];
}

export function generateLeaderSchedule(
  epochNumber: number,
  validators: Validator[],
  slotsPerEpoch: number = SOLANA_CONSTANTS.SLOTS_PER_EPOCH
): LeaderSchedule {
  const activeValidators = validators.filter((v) => v.is_active && v.stake > 0);

  if (activeValidators.length === 0) {
    throw new Error("No active validators with stake");
  }

  const totalStake = activeValidators.reduce((sum, v) => sum + v.stake, 0);
  const startSlot = epochNumber * slotsPerEpoch;
  const endSlot = startSlot + slotsPerEpoch - 1;

  const schedule: Record<number, string> = {};

  // In real Solana, leaders are assigned in groups of 4 consecutive slots
  // We'll use groups of 4 for realism
  const slotsPerLeaderGroup = 4;

  for (let slot = startSlot; slot <= endSlot; slot += slotsPerLeaderGroup) {
    const leader = weightedRandomSelect(activeValidators, totalStake);

    for (
      let i = 0;
      i < slotsPerLeaderGroup && slot + i <= endSlot;
      i++
    ) {
      schedule[slot + i] = leader.pubkey;
    }
  }

  return {
    epochNumber,
    startSlot,
    endSlot,
    schedule,
  };
}

export function getLeaderForSlot(
  slot: number,
  schedule: LeaderSchedule
): string | null {
  return schedule.schedule[slot] || null;
}

export function getEpochForSlot(slot: number): number {
  return Math.floor(slot / SOLANA_CONSTANTS.SLOTS_PER_EPOCH);
}

export function getSlotInEpoch(slot: number): number {
  return slot % SOLANA_CONSTANTS.SLOTS_PER_EPOCH;
}

export function getEpochProgress(slot: number): number {
  const slotInEpoch = getSlotInEpoch(slot);
  return (slotInEpoch / SOLANA_CONSTANTS.SLOTS_PER_EPOCH) * 100;
}
