"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Coins,
  Twitter,
  Globe,
  MessageCircle,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Loader2,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { usePumpPortalWS, PumpPortalTrade } from "@/hooks/usePumpPortalWS";

interface TokenTrade {
  id: string;
  token_mint: string;
  trade_type: "buy" | "sell";
  sol_amount: number;
  token_amount: number;
  trader_wallet: string;
  signature: string;
  created_at: string;
}

interface TokenDetails {
  id: string;
  mint_address: string;
  name: string;
  symbol: string;
  description: string | null;
  image_url: string | null;
  price_sol: number | null;
  market_cap_sol: number | null;
  market_cap_usd: number | null;
  virtual_sol_reserves: number | null;
  virtual_token_reserves: number | null;
  total_supply: number | null;
  is_graduated: boolean;
  raydium_pool: string | null;
  creator_wallet: string;
  twitter_url: string | null;
  website_url: string | null;
  telegram_url: string | null;
  reply_count: number | null;
  created_at: string;
  pumpfun_url: string;
  recent_trades: TokenTrade[];
}

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  const [token, setToken] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Trade state
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [trading, setTrading] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);

  // Chart state
  interface ChartDataPoint {
    timestamp: number;
    time: string;
    price: number;
    volume: number;
  }
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartInterval, setChartInterval] = useState("5");

  // Real-time trades state
  const [realtimeTrades, setRealtimeTrades] = useState<PumpPortalTrade[]>([]);

  // Real-time WebSocket connection
  const handleRealtimeTrade = useCallback((trade: PumpPortalTrade) => {
    // Update real-time trades list
    setRealtimeTrades((prev) => [trade, ...prev].slice(0, 20));

    const price = trade.solAmount / trade.tokenAmount;

    // Update token data with new market cap and reserves
    setToken((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        price_sol: price,
        market_cap_sol: trade.marketCapSol,
        virtual_sol_reserves: trade.vSolInBondingCurve,
        virtual_token_reserves: trade.vTokensInBondingCurve,
      };
    });

    // Add new data point to chart
    setChartData((prev) => {
      const newPoint: ChartDataPoint = {
        timestamp: trade.timestamp,
        time: new Date(trade.timestamp).toISOString(),
        price,
        volume: trade.solAmount / 1e9,
      };
      return [...prev, newPoint].slice(-200); // Keep last 200 points
    });

    // Save stats to DB for persistence across refreshes
    fetch(`/api/tokens/${address}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price_sol: price,
        market_cap_sol: trade.marketCapSol,
        virtual_sol_reserves: trade.vSolInBondingCurve,
        virtual_token_reserves: trade.vTokensInBondingCurve,
      }),
    }).catch(console.error);
  }, [address]);

  const { isConnected, lastTrade } = usePumpPortalWS({
    tokenMint: address,
    onTrade: handleRealtimeTrade,
    enabled: !!address,
  });

  // Fetch SOL and token balances when wallet connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey || !connection) return;

      // Fetch SOL balance
      const solBal = await connection.getBalance(publicKey);
      setSolBalance(solBal / 1e9);

      // Fetch token balance using getTokenAccountsByOwner (more reliable)
      if (address) {
        try {
          const mintPubkey = new PublicKey(address);
          const tokenAccounts = await connection.getTokenAccountsByOwner(
            publicKey,
            { mint: mintPubkey },
            "confirmed"
          );

          if (tokenAccounts.value.length > 0) {
            // Sum all token accounts for this mint (usually just 1)
            let totalBalance = 0;
            for (const account of tokenAccounts.value) {
              const accountInfo = await connection.getTokenAccountBalance(account.pubkey);
              totalBalance += accountInfo.value.uiAmount || 0;
            }
            setTokenBalance(totalBalance);
          } else {
            setTokenBalance(0);
          }
        } catch (error) {
          console.error("Failed to fetch token balance:", error);
          setTokenBalance(0);
        }
      }
    };

    fetchBalances();
  }, [publicKey, connection, address]);

  // Fetch token metadata and poll for updates
  useEffect(() => {
    if (address) {
      fetchToken(true); // Initial fetch with loading

      // Poll token data every 10 seconds (silent refresh)
      const interval = setInterval(() => fetchToken(false), 10000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchToken = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/tokens/${address}`);
      const data = await res.json();
      if (data.success) {
        setToken(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch token:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      const res = await fetch(`/api/tokens/${address}/chart?interval=${chartInterval}`);
      const data = await res.json();
      if (data.success && data.data) {
        setChartData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setChartLoading(false);
    }
  };

  // Fetch chart data on mount and interval change
  useEffect(() => {
    if (address) {
      setChartLoading(true);
      fetchChartData();

      // Poll chart data every 30 seconds
      const interval = setInterval(fetchChartData, 30000);
      return () => clearInterval(interval);
    }
  }, [address, chartInterval]);

  const handleTrade = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setVisible(true);
      return;
    }

    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setTrading(true);
    try {
      // 1. Get unsigned transaction from API
      const endpoint = tradeType === "buy"
        ? `/api/tokens/${address}/buy`
        : `/api/tokens/${address}/sell`;

      const body = tradeType === "buy"
        ? { walletPubkey: publicKey.toBase58(), solAmount: amount }
        : { walletPubkey: publicKey.toBase58(), tokenAmount: amount };

      toast.info("Preparing transaction...");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to prepare transaction");
      }

      // 2. Deserialize and sign transaction
      toast.info("Please sign the transaction in your wallet...");

      const txBuffer = Buffer.from(data.transaction, "base64");
      const transaction = VersionedTransaction.deserialize(txBuffer);
      const signedTx = await signTransaction(transaction);

      // 3. Send to Solana
      toast.info("Sending transaction to Solana...");

      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true }
      );

      toast.info(`Transaction sent: ${signature.slice(0, 8)}...`);

      // 4. Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, "confirmed");

      if (confirmation.value.err) {
        throw new Error("Transaction failed on chain");
      }

      toast.success(
        tradeType === "buy"
          ? `Successfully bought ${token?.symbol}!`
          : `Successfully sold ${token?.symbol}!`,
        {
          description: (
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Solscan
            </a>
          ),
        }
      );

      setTradeAmount("");
      fetchToken();

      // Refresh SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / 1e9);
    } catch (error: unknown) {
      console.error("Trade error:", error);
      const errorMessage = error instanceof Error ? error.message : "Trade failed";
      toast.error(errorMessage);
    } finally {
      setTrading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return "0";
    if (price < 0.000001) return price.toFixed(9);
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatNumber = (n: number | null) => {
    if (!n) return "0";
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
    return n.toFixed(2);
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Token not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-6 space-y-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Breadcrumb */}
      <motion.div variants={staggerItem}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/app/tokens">Tokens</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>${token.symbol}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex items-center gap-4">
          {token.image_url ? (
            <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={token.image_url}
                alt={token.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{token.name}</h1>
              {token.is_graduated && (
                <Badge variant="default" className="bg-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  DEX
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">${token.symbol}</span>
              <button
                onClick={copyAddress}
                className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {shortenAddress(address)}
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Social & External Links */}
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          {token.twitter_url && (
            <a href={token.twitter_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
            </a>
          )}
          {token.website_url && (
            <a href={token.website_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <Globe className="h-4 w-4" />
              </Button>
            </a>
          )}
          {token.telegram_url && (
            <a href={token.telegram_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </a>
          )}
          <a
            href={token.pumpfun_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Pump.fun
            </Button>
          </a>
          <a
            href={`https://solscan.io/token/${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Solscan
            </Button>
          </a>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Info */}
        <motion.div variants={staggerItem} className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-xl font-bold font-mono">
                  {token.price_sol && token.price_sol > 0
                    ? formatPrice(token.price_sol)
                    : lastTrade
                    ? formatPrice(lastTrade.solAmount / lastTrade.tokenAmount)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">SOL</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="text-xl font-bold font-mono">
                  {token.market_cap_sol && token.market_cap_sol > 0
                    ? formatNumber(token.market_cap_sol)
                    : lastTrade?.marketCapSol
                    ? formatNumber(lastTrade.marketCapSol)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">SOL</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">MCap USD</p>
                <p className="text-xl font-bold font-mono">
                  ${formatNumber(token.market_cap_usd)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Replies</p>
                <p className="text-xl font-bold">
                  {token.reply_count || 0}
                </p>
                <p className="text-xs text-muted-foreground">on Klodchain</p>
              </CardContent>
            </Card>
          </div>

          {/* Price Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Price Chart</CardTitle>
                  {isConnected && (
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs text-green-500 font-medium">LIVE</span>
                    </div>
                  )}
                </div>
                <Select value={chartInterval} onValueChange={setChartInterval}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1m</SelectItem>
                    <SelectItem value="5">5m</SelectItem>
                    <SelectItem value="15">15m</SelectItem>
                    <SelectItem value="60">1h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <p>Waiting for trades...</p>
                  <p className="text-xs">Chart will update in real-time</p>
                </div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        }}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={50}
                      />
                      <YAxis
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value) => formatPrice(value)}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(data.time).toLocaleString()}
                                </p>
                                <p className="font-mono font-bold">
                                  {formatPrice(data.price)} SOL
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Vol: {data.volume.toFixed(4)} SOL
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trades & Info Tabs */}
          <Tabs defaultValue="trades">
            <TabsList>
              <TabsTrigger value="trades">Recent Trades</TabsTrigger>
              <TabsTrigger value="info">Token Info</TabsTrigger>
            </TabsList>

            <TabsContent value="trades">
              <Card>
                <CardContent className="pt-6">
                  {realtimeTrades.length === 0 && token.recent_trades.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No trades recorded yet
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>SOL</TableHead>
                          <TableHead>Tokens</TableHead>
                          <TableHead>Trader</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Real-time trades first */}
                        {realtimeTrades.map((trade) => (
                          <TableRow key={trade.signature} className="bg-primary/5">
                            <TableCell>
                              <Badge
                                variant={trade.txType === "buy" ? "default" : "destructive"}
                                className={trade.txType === "buy" ? "bg-green-500" : ""}
                              >
                                {trade.txType === "buy" ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {trade.txType.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatNumber(trade.solAmount / 1e9)} SOL
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatNumber(trade.tokenAmount / 1e6)}
                            </TableCell>
                            <TableCell>
                              <a
                                href={`https://solscan.io/account/${trade.traderPublicKey}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-mono text-sm"
                              >
                                {shortenAddress(trade.traderPublicKey)}
                              </a>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <span className="text-green-500 text-xs">LIVE</span>{" "}
                              {new Date(trade.timestamp).toLocaleTimeString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Historical trades */}
                        {token.recent_trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>
                              <Badge
                                variant={trade.trade_type === "buy" ? "default" : "destructive"}
                                className={trade.trade_type === "buy" ? "bg-green-500" : ""}
                              >
                                {trade.trade_type === "buy" ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {trade.trade_type.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatNumber(trade.sol_amount / 1e9)} SOL
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatNumber(trade.token_amount / 1e6)}
                            </TableCell>
                            <TableCell>
                              <a
                                href={`https://solscan.io/account/${trade.trader_wallet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-mono text-sm"
                              >
                                {shortenAddress(trade.trader_wallet)}
                              </a>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(trade.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {token.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p>{token.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Supply</p>
                      <p className="font-mono">
                        {formatNumber(token.total_supply ? token.total_supply / 1e6 : 1_000_000_000)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Creator</p>
                      <a
                        href={`https://solscan.io/account/${token.creator_wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-sm"
                      >
                        {shortenAddress(token.creator_wallet)}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Created</p>
                      <p>{new Date(token.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <p>{token.is_graduated ? "Listed on Raydium DEX" : "On Bonding Curve"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Mint Address</p>
                    <p className="font-mono text-sm break-all">{address}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Right Column - Trade Panel */}
        <motion.div variants={staggerItem} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Trade {token.symbol}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trade Type Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tradeType === "buy" ? "default" : "outline"}
                  onClick={() => setTradeType("buy")}
                  className="w-full"
                >
                  Buy
                </Button>
                <Button
                  variant={tradeType === "sell" ? "destructive" : "outline"}
                  onClick={() => setTradeType("sell")}
                  className="w-full"
                >
                  Sell
                </Button>
              </div>

              {/* Wallet Warning */}
              {!connected && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Connect wallet to trade</span>
                  </div>
                </div>
              )}

              {/* Balance */}
              {connected && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  {tradeType === "buy" ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SOL Balance</span>
                      <button
                        type="button"
                        onClick={() => setTradeAmount(Math.max(0, solBalance - 0.01).toFixed(4))}
                        className="font-mono hover:text-primary transition-colors"
                      >
                        {solBalance.toFixed(4)} SOL
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Token Balance</span>
                      <button
                        type="button"
                        onClick={() => setTradeAmount(tokenBalance.toLocaleString())}
                        className="font-mono hover:text-primary transition-colors"
                      >
                        {tokenBalance.toLocaleString()} {token?.symbol}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">
                    {tradeType === "buy" ? "SOL Amount" : `${token.symbol} Amount`}
                  </label>
                  {connected && tradeType === "buy" && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setTradeAmount(Math.max(0, solBalance - 0.01).toFixed(4))}
                    >
                      Max
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  min="0"
                  step="0.001"
                  disabled={trading}
                />
              </div>

              {/* Estimated Output */}
              {tradeAmount && parseFloat(tradeAmount) > 0 && token.price_sol && (
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Estimated output (before slippage)
                  </p>
                  <p className="text-lg font-bold font-mono">
                    {tradeType === "buy"
                      ? `~${formatNumber(parseFloat(tradeAmount) / token.price_sol)} ${token.symbol}`
                      : `~${formatPrice(parseFloat(tradeAmount) * token.price_sol)} SOL`}
                  </p>
                </div>
              )}

              {/* Trade Button */}
              {connected ? (
                <Button
                  onClick={handleTrade}
                  disabled={trading || !tradeAmount || parseFloat(tradeAmount) <= 0}
                  className="w-full"
                  variant={tradeType === "buy" ? "default" : "destructive"}
                >
                  {trading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : tradeType === "buy" ? (
                    `Buy ${token.symbol}`
                  ) : (
                    `Sell ${token.symbol}`
                  )}
                </Button>
              ) : (
                <Button onClick={() => setVisible(true)} className="w-full">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}

              {/* Price Info */}
              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>Price: {formatPrice(token.price_sol)} SOL</p>
                <p className="text-xs">5% max slippage</p>
              </div>
            </CardContent>
          </Card>

          {/* Warning Card */}
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3 text-sm">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-500">Real SOL Transaction</p>
                  <p className="text-muted-foreground">
                    Trades execute on Solana mainnet via Pump.fun.
                    Make sure you understand the risks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
