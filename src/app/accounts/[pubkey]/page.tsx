import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowDownToLine,
  Send,
  Wallet,
  Clock,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WalletData {
  pubkey: string;
  balance: number;
  transaction_count: number;
  total_received: number;
  total_sent: number;
  created_at: string;
}

interface WalletTransaction {
  id: string;
  from_pubkey: string | null;
  to_pubkey: string;
  amount: number;
  transaction_type: string;
  created_at: string;
}

async function getWallet(pubkey: string): Promise<WalletData | null> {
  const { data } = await supabase
    .from("wallets")
    .select("pubkey, balance, transaction_count, total_received, total_sent, created_at")
    .eq("pubkey", pubkey)
    .single();

  return data;
}

async function getWalletTransactions(pubkey: string): Promise<WalletTransaction[]> {
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .or(`from_pubkey.eq.${pubkey},to_pubkey.eq.${pubkey}`)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;
  const wallet = await getWallet(pubkey);

  if (!wallet) {
    notFound();
  }

  const transactions = await getWalletTransactions(pubkey);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back Button */}
      <Link
        href="/wallet/leaderboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leaderboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <Badge>klodchain</Badge>
        </div>
        <p className="text-muted-foreground text-sm break-all">{wallet.pubkey}</p>
      </div>

      {/* Balance Card */}
      <Card className="border-primary/30 mb-6">
        <CardContent className="py-6 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Total Balance
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-foreground">
              {wallet.balance.toLocaleString()}
            </span>
            <span className="text-xl text-primary">$klodchain</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Transactions</p>
            <p className="text-xl text-foreground">
              {wallet.transaction_count}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Received</p>
            <p className="text-xl text-foreground">
              {wallet.total_received.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Sent</p>
            <p className="text-xl text-foreground">
              {wallet.total_sent.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-muted-foreground">Created</span>
            <span className="text-foreground">{formatDate(wallet.created_at)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Address</span>
            <span className="text-foreground text-sm">{formatAddress(wallet.pubkey)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 rotate-45 bg-muted mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <Link
                  key={tx.id}
                  href={`/explorer/wallet-tx/${tx.id}`}
                  className="flex items-center justify-between bg-muted/50 rounded p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.to_pubkey === pubkey
                          ? "bg-green-500/20 text-green-400"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {tx.to_pubkey === pubkey ? (
                        <ArrowDownToLine className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground text-sm">
                        {tx.transaction_type === "faucet_claim"
                          ? "Faucet Claim"
                          : tx.to_pubkey === pubkey
                          ? "Received"
                          : "Sent"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={
                      tx.to_pubkey === pubkey
                        ? "text-green-400"
                        : "text-destructive"
                    }
                  >
                    {tx.to_pubkey === pubkey ? "+" : "-"}
                    {tx.amount} $klodchain
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
