"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Coins,
  Plus,
  Search,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import {
  staggerContainer,
  staggerItem,
  fadeInUp,
  gridItem,
} from "@/lib/animations";

interface CreatedToken {
  id: string;
  mint_address: string;
  name: string;
  symbol: string;
  description: string | null;
  image_url: string | null;
  price_sol: number | null;
  price_usd: number | null;
  market_cap_sol: number | null;
  market_cap_usd: number | null;
  sol_price: number;
  is_graduated: boolean;
  creator_wallet: string;
  created_at: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<CreatedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");

  useEffect(() => {
    fetchTokens();
  }, [sort]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        order: "desc",
        limit: "50",
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/tokens?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setTokens(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTokens();
  };

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return "—";
    if (price < 0.000001) return price.toFixed(9);
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatMarketCap = (mc: number | null) => {
    if (!mc) return "—";
    if (mc >= 1_000_000) return `${(mc / 1_000_000).toFixed(2)}M`;
    if (mc >= 1_000) return `${(mc / 1_000).toFixed(2)}K`;
    return mc.toFixed(2);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-6 space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeInUp}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tokens</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Coins className="h-6 w-6 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold">Tokens</h1>
            <p className="text-muted-foreground text-sm">
              Real memecoins launched via Klodchain. Tradeable on any bots.
            </p>
          </div>
        </div>

        <Link href="/app/tokens/create">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Launch Token
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      {/* Search and Sort */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col sm:flex-row gap-4"
      >
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="market_cap">Market Cap</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tokens Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <motion.div variants={staggerItem}>
          <Card className="p-12 text-center">
            <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to launch a token on Klodchain!
            </p>
            <Link href="/app/tokens/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Launch Token
              </Button>
            </Link>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={staggerContainer}
        >
          {tokens.map((token, index) => (
            <motion.div
              key={token.mint_address}
              variants={gridItem}
              custom={index}
            >
              <Link href={`/app/token/${token.mint_address}`}>
                <Card className="group hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {token.image_url ? (
                        <Image
                          src={token.image_url}
                          alt={token.name}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Coins className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {token.name}
                          </h3>
                          {token.is_graduated && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              DEX
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${token.symbol}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-mono font-medium">
                          ${formatPrice(token.price_usd ?? (token.price_sol && token.sol_price ? token.price_sol * token.sol_price : null))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">MCap</p>
                        <p className="font-mono font-medium">
                          ${formatMarketCap(token.market_cap_usd ?? (token.market_cap_sol && token.sol_price ? token.market_cap_sol * token.sol_price : null))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(token.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
