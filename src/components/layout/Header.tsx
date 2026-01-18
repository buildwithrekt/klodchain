"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TpsCounter } from "@/components/dashboard/TpsCounter";
import { ThemeSelector } from "@/components/layout/ThemeSelector";
import { WalletButton } from "@/components/wallet/WalletButton";
import {
  Menu,
  Search,
  BarChart3,
  Wallet,
  MessageCircle,
  Bot,
  Map,
  Code,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer", icon: Search },
  { href: "/tokens", label: "Tokens", icon: Wallet },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/deploy", label: "Deploy Agent", icon: Bot },
  { href: "/documentation", label: "API", icon: Code },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl px-4 mx-auto flex h-14 items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold">klodchain</h1>
          </Link>
          <Badge variant="success" className="gap-1 hidden sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </Badge>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <TpsCounter />
          <WalletButton />
          <ThemeSelector />
          <Drawer open={open} onOpenChange={setOpen} direction="right">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="border-b">
                <DrawerTitle>klodchain</DrawerTitle>
              </DrawerHeader>
              <nav className="flex flex-col p-4 gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive(link.href)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
}
