"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  User,
  Coins,
  Plus,
  ExternalLink,
  TrendingUp,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface CreatedToken {
  id: string;
  mint_address: string;
  name: string;
  symbol: string;
  description: string | null;
  image_url: string | null;
  price_sol: number | null;
  market_cap_sol: number | null;
  is_graduated: boolean;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [tokens, setTokens] = useState<CreatedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchMyTokens();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchMyTokens = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/tokens?creator=${publicKey.toBase58()}&limit=50`
      );
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

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 2000);
    }
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

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!connected) {
    return (
      <motion.div
        className="max-w-4xl mx-auto px-4 py-6 space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/app">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="py-16">
            <CardContent className="text-center space-y-4">
              <motion.div
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wallet className="h-10 w-10 text-primary" />
              </motion.div>
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Connect your Solana wallet to view your profile and created tokens.
              </p>
              <Button onClick={() => setVisible(true)} size="lg" className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Breadcrumb */}
      <motion.div variants={itemVariants}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Profile Header */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <User className="h-10 w-10 text-primary" />
              </motion.div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold mb-1">My Profile</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <code className="text-sm text-muted-foreground font-mono">
                    {shortenAddress(publicKey?.toBase58() || "")}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://solscan.io/account/${publicKey?.toBase58()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Solscan
                  </Button>
                </a>
                <Link href="/app/tokens/create">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Token
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring" }}>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-primary">{tokens.length}</p>
              <p className="text-sm text-muted-foreground">Tokens Created</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring" }}>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-500">
                {tokens.filter((t) => t.is_graduated).length}
              </p>
              <p className="text-sm text-muted-foreground">Graduated</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring" }}>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold">
                {tokens.filter((t) => t.mint_address.toLowerCase().endsWith("kld")).length}
              </p>
              <p className="text-sm text-muted-foreground">KLD Addresses</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* My Tokens */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              My Created Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-lg border">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tokens.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Coins className="h-8 w-8 text-muted-foreground" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first token on Klodchain!
                </p>
                <Link href="/app/tokens/create">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Token
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tokens.map((token, index) => (
                  <motion.div
                    key={token.mint_address}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Link href={`/app/token/${token.mint_address}`}>
                      <Card className="cursor-pointer hover:border-primary/50 transition-colors h-full">
                        <CardContent className="py-4">
                          <div className="flex items-center gap-3">
                            {token.image_url ? (
                              <Image
                                src={token.image_url}
                                alt={token.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Coins className="h-6 w-6 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">
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

                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Price</p>
                              <p className="font-mono text-sm">
                                {formatPrice(token.price_sol)} SOL
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MCap</p>
                              <p className="font-mono text-sm">
                                {formatMarketCap(token.market_cap_sol)} SOL
                              </p>
                            </div>
                          </div>

                          {token.mint_address.toLowerCase().endsWith("kld") && (
                            <div className="mt-3 pt-3 border-t">
                              <Badge variant="outline" className="text-xs font-mono">
                                ...{token.mint_address.slice(-8)}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
