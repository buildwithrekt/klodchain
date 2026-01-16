"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TpsCounter } from "@/components/dashboard/TpsCounter";
import { WalletButton } from "@/components/wallet/WalletButton";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/stats", label: "Stats" },
  { href: "/wallet", label: "Wallet" },
  { href: "/chat", label: "Chat" },
  { href: "/deploy", label: "Deploy Agent" },
  { href: "/roadmap", label: "Roadmap" },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                isActive(link.href)
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
