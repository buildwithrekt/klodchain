"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSimulationStore } from "@/stores/simulation-store";
import { SOLANA_CONSTANTS } from "@/lib/utils/constants";
import { Clock } from "lucide-react";

export function EpochProgress() {
  const { currentSlot } = useSimulationStore();

  const currentEpoch = Math.floor(currentSlot / SOLANA_CONSTANTS.SLOTS_PER_EPOCH);
  const slotInEpoch = currentSlot % SOLANA_CONSTANTS.SLOTS_PER_EPOCH;
  const progress = (slotInEpoch / SOLANA_CONSTANTS.SLOTS_PER_EPOCH) * 100;
  const slotsRemaining = SOLANA_CONSTANTS.SLOTS_PER_EPOCH - slotInEpoch;

  // Estimate time remaining (at 2s per slot)
  const secondsRemaining = slotsRemaining * (SOLANA_CONSTANTS.DEFAULT_SLOT_DURATION_MS / 1000);
  const minutesRemaining = Math.floor(secondsRemaining / 60);
  const secsRemaining = Math.floor(secondsRemaining % 60);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Epoch {currentEpoch}
          </span>
          <span className="text-muted-foreground font-normal">
            {slotInEpoch.toLocaleString()} / {SOLANA_CONSTANTS.SLOTS_PER_EPOCH.toLocaleString()} slots
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.toFixed(1)}% complete</span>
          <span>~{minutesRemaining}m {secsRemaining}s remaining</span>
        </div>
      </CardContent>
    </Card>
  );
}
