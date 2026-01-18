"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Coins,
  Twitter,
  Globe,
  MessageCircle,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import type { Token, TokenTrade } from "@/types";

interface TokenDetails extends Token {
  holder_count: number;
  recent_trades: TokenTrade[];
}

interface ChartData {
  time: string;
  price: number;
  timestamp: number;
}

export default function TokenDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const [token, setToken] = useState<TokenDetails | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("24h");
  const [copied, setCopied] = useState(false);

  // Trade state
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [trading, setTrading] = useState(false);
  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    const pubkey = localStorage.getItem("klodchain_wallet");
    if (pubkey) {
      setWalletPubkey(pubkey);
      fetchWalletData(pubkey);
    }
  }, []);

  // Fetch token data only once on page load
  useEffect(() => {
    if (address) {
      fetchToken();
    }
  }, [address]);

  // Fetch chart data when period changes
  useEffect(() => {
    if (address) {
      fetchChart();
    }
  }, [address, chartPeriod]);

  useEffect(() => {
    if (walletPubkey && token) {
      fetchTokenHolding();
    }
  }, [walletPubkey, token]);

  const fetchToken = async () => {
    try {
      const res = await fetch(`/api/tokens/${address}`);
      const data = await res.json();
      if (data.success) {
        setToken(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch token:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      const res = await fetch(`/api/tokens/${address}/chart?period=${chartPeriod}`);
      const data = await res.json();
      if (data.success) {
        setChartData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch chart:", error);
    }
  };

  const fetchWalletData = async (pubkey: string) => {
    try {
      const res = await fetch(`/api/wallet/${pubkey}`);
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.wallet.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  };

  const fetchTokenHolding = async () => {
    try {
      const res = await fetch(`/api/tokens/${address}/holders?limit=1000`);
      const data = await res.json();
      if (data.success) {
        const myHolding = data.data.find(
          (h: any) => h.wallet_pubkey === walletPubkey
        );
        setTokenBalance(myHolding?.amount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch holding:", error);
    }
  };

  const handleTrade = async () => {
    if (!walletPubkey) {
      toast.error("Please connect your wallet");
      return;
    }

    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setTrading(true);
    try {
      const endpoint = tradeType === "buy"
        ? `/api/tokens/${address}/buy`
        : `/api/tokens/${address}/sell`;

      const body = tradeType === "buy"
        ? { walletPubkey, usdkAmount: amount }
        : { walletPubkey, tokenAmount: amount };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          tradeType === "buy"
            ? `Bought ${data.trade.tokensReceived.toFixed(2)} ${token?.symbol}`
            : `Sold ${amount} ${token?.symbol} for $${data.trade.usdkReceived.toFixed(2)} USDK`
        );
        setTradeAmount("");
        fetchToken();
        fetchChart();
        if (walletPubkey) {
          fetchWalletData(walletPubkey);
          fetchTokenHolding();
        }
      } else {
        toast.error(data.error || "Trade failed");
      }
    } catch (error) {
      console.error("Trade error:", error);
      toast.error("Trade failed");
    } finally {
      setTrading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "0";
    if (price < 0.000001) return price.toFixed(9);
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatNumber = (n: number) => {
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
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/tokens">Tokens</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>${token.symbol}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
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
              <span className="text-2xl font-bold text-primary">
                {token.symbol.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{token.name}</h1>
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

        {/* Social Links */}
        <div className="flex items-center gap-2 sm:ml-auto">
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
          <Link href={`/explorer/tx?search=${address}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Explorer
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-xl font-bold">${formatPrice(token.price)}</p>
                <p className="text-xs text-muted-foreground">USDK</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="text-xl font-bold">${formatNumber(token.market_cap)}</p>
                <p className="text-xs text-muted-foreground">USDK</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Volume 24h</p>
                <p className="text-xl font-bold">${formatNumber(token.volume_24h)}</p>
                <p className="text-xs text-muted-foreground">USDK</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Holders</p>
                <p className="text-xl font-bold">{token.holder_count}</p>
                <p className="text-xs text-muted-foreground">wallets</p>
              </CardContent>
            </Card>
          </div>

          {/* Virtual Bonding Curve Pool */}
          <Card className="border-primary/30">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Bonding Curve (Virtual Pool)</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">x * y = k</Badge>
                  {(token as any).is_graduated && (
                    <Badge variant="default" className="bg-green-500">Graduated</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">USDK Reserve</p>
                  <p className="text-lg font-bold font-mono">
                    ${formatNumber(Number((token as any).virtual_usdk_reserve) || 4000)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{token.symbol} Reserve</p>
                  <p className="text-lg font-bold font-mono">
                    {formatNumber((Number((token as any).virtual_token_reserve) || 1000000000000000) / 1_000_000)}
                  </p>
                </div>
              </div>
              {/* Progress to graduation */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress to graduation</span>
                  <span className="font-mono">
                    ${formatNumber(token.market_cap)} / $69K
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min((token.market_cap / 69000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Price Chart</CardTitle>
                <div className="flex gap-1 flex-wrap">
                  {["1m", "5m", "15m", "1h", "24h", "7d", "30d"].map((p) => (
                    <Button
                      key={p}
                      variant={chartPeriod === p ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setChartPeriod(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="time"
                        tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        tickFormatter={(v) => formatPrice(v)}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatPrice(value), "Price"]}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No trading data yet
                  </div>
                )}
              </div>
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
                  {token.recent_trades.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No trades yet. Be the first to trade!
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Trader</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {token.recent_trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>
                              <Badge
                                variant={trade.trade_type === "buy" ? "success" : "destructive"}
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
                              {formatNumber(trade.token_amount / 1_000_000)} {token.symbol}
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatPrice(trade.price_per_token)}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/accounts/${trade.trader_pubkey}`}
                                className="text-primary hover:underline font-mono text-sm"
                              >
                                {shortenAddress(trade.trader_pubkey)}
                              </Link>
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
                      <p className="font-mono">{formatNumber(token.total_supply / 1_000_000)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Circulating Supply</p>
                      <p className="font-mono">{formatNumber(token.circulating_supply / 1_000_000)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Creator</p>
                      <Link
                        href={`/accounts/${token.creator_pubkey}`}
                        className="text-primary hover:underline font-mono text-sm"
                      >
                        {shortenAddress(token.creator_pubkey)}
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Created</p>
                      <p>{new Date(token.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contract Address</p>
                    <p className="font-mono text-sm break-all">{address}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Trade Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trade {token.symbol}</CardTitle>
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

              {/* Balance Display */}
              {walletPubkey && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">USDK Balance</span>
                    <span className="font-mono">${walletBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{token.symbol} Balance</span>
                    <span className="font-mono">{tokenBalance.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">
                    {tradeType === "buy" ? "USDK Amount" : `${token.symbol} Amount`}
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      if (tradeType === "buy") {
                        setTradeAmount(walletBalance.toString());
                      } else {
                        setTradeAmount(tokenBalance.toString());
                      }
                    }}
                  >
                    Max
                  </button>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Estimated Output */}
              {tradeAmount && parseFloat(tradeAmount) > 0 && (
                <div className="p-3 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    You will receive approx.
                  </p>
                  <p className="text-lg font-bold">
                    {tradeType === "buy"
                      ? `${formatNumber(parseFloat(tradeAmount) / token.price)} ${token.symbol}`
                      : `$${formatPrice(parseFloat(tradeAmount) * token.price)} USDK`}
                  </p>
                </div>
              )}

              {/* Trade Button */}
              {walletPubkey ? (
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
                <Link href="/wallet" className="block">
                  <Button className="w-full">Connect Wallet</Button>
                </Link>
              )}

              {/* Price Info */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Current Price: ${formatPrice(token.price)} USDK</p>
                <p className="text-xs mt-1">Virtual bonding curve (pump.fun style)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
