"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TpsCounter } from "@/components/dashboard/TpsCounter";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl px-4 mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold">klodchain</h1>
          </Link>
          <span className="text-muted-foreground text-xs hidden sm:inline">
            autonomous blockchain designed by claude
          </span>
          <Badge variant="success" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <TpsCounter />
          <Link
            href="/explorer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Explorer
          </Link>
          <Link
            href="/stats"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Stats
          </Link>
          <Link
            href="/wallet"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Wallet
          </Link>
          <Link
            href="/chat"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Chat
          </Link>
          <Link
            href="/roadmap"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Roadmap
          </Link>
        </div>
      </div>
    </header>
  );
}
