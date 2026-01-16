"use client";

import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSimulationStore } from "@/stores/simulation-store";
import { SPEED_MULTIPLIERS } from "@/lib/utils/constants";

export function SimulationControls() {
  const { isRunning, speed, start, stop, reset, setSpeed, advanceOneSlot } =
    useSimulationStore();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isRunning ? "destructive" : "default"}
        size="sm"
        onClick={() => (isRunning ? stop() : start())}
      >
        {isRunning ? (
          <>
            <Pause className="h-4 w-4" />
            Stop
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Start
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => advanceOneSlot()}
        disabled={isRunning}
      >
        <SkipForward className="h-4 w-4" />
        Step
      </Button>

      <Button variant="outline" size="sm" onClick={() => reset()}>
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>

      <Select
        value={speed.toString()}
        onValueChange={(v) => setSpeed(parseFloat(v))}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SPEED_MULTIPLIERS.map((m) => (
            <SelectItem key={m} value={m.toString()}>
              {m}x
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
