"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TpsCounter } from "@/components/dashboard/TpsCounter";
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
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/deploy", label: "Deploy Agent", icon: Bot },
  { href: "/api-docs", label: "API", icon: Code },
  { href: "/roadmap", label: "Roadmap", icon: Map },
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

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4">
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
        </div>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center gap-2">
          <TpsCounter />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {NAV_LINKS.map((link, index) => (
                <div key={link.href}>
                  <DropdownMenuItem asChild>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-2 cursor-pointer ${
                        isActive(link.href) ? "text-primary" : ""
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                  {index === 3 && <DropdownMenuSeparator />}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
