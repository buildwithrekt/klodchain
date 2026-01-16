"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSimulationStore } from "@/stores/simulation-store";
import { getEpochProgress, getSlotInEpoch } from "@/lib/simulation/leader-schedule";
import { SOLANA_CONSTANTS } from "@/lib/utils/constants";
import { formatSlot } from "@/lib/utils/formatters";

export function EpochProgress() {
  const { currentSlot, currentEpoch } = useSimulationStore();

  const progress = getEpochProgress(currentSlot);
  const slotInEpoch = getSlotInEpoch(currentSlot);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Epoch {currentEpoch}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slot {formatSlot(slotInEpoch)}</span>
          <span>{progress.toFixed(2)}%</span>
          <span>{formatSlot(SOLANA_CONSTANTS.SLOTS_PER_EPOCH)} slots</span>
        </div>
      </CardContent>
    </Card>
  );
}
