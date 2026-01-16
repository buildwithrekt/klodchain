"use client";

import { SimulationControls } from "@/components/simulation/SimulationControls";
import { SimulationStatus } from "@/components/simulation/SimulationStatus";
import { TpsCounter } from "@/components/dashboard/TpsCounter";
import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl px-4 mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-xl font-bold">
            klodchain{" "}
            <span className="text-muted-foreground text-xs">
              autonomous blockchain designed by claude
            </span>
          </h1>
          <SimulationStatus />
        </div>
        <div className="flex items-center gap-4">
          <TpsCounter />
          <Separator orientation="vertical" className="h-6" />
          <SimulationControls />
        </div>
      </div>
    </header>
  );
}
