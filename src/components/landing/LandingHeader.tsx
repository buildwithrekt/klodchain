"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl px-4 mx-auto flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold">klodchain</h1>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/roadmap"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Roadmap
          </Link>
          <Link
            href="https://x.com/i/communities/2012087455520805268"
            target="_blank"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Community
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="https://app.klodchain.com">Launch App</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
