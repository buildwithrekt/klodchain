"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Check,
  ArrowDownToLine,
  Send,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletData {
  pubkey: string;
  privateKey?: string;
  balance: number;
  transactionCount: number;
  totalReceived: number;
  totalSent: number;
  faucetReady: boolean;
  faucetCooldownRemaining: number;
}

interface Transaction {
  id: string;
  signature: string;
  from_pubkey: string | null;
  to_pubkey: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
}

export default function WalletPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [importKey, setImportKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Load wallet address from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("klodchain_wallet");
    if (stored) {
      setWalletAddress(stored);
    } else {
      setIsPageLoading(false);
    }
  }, []);

  // Fetch wallet data when address changes
  useEffect(() => {
    if (!walletAddress) return;

    const fetchWallet = async () => {
      setIsPageLoading(true);
      try {
        const res = await fetch(`/api/wallet/${walletAddress}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (data.success) {
          setWallet((prev) => ({
            pubkey: data.wallet.pubkey,
            privateKey: prev?.privateKey, // Preserve private key if exists
            balance: data.wallet.balance,
            transactionCount: data.wallet.transactionCount,
            totalReceived: data.wallet.totalReceived,
            totalSent: data.wallet.totalSent,
            faucetReady: data.wallet.faucetReady,
            faucetCooldownRemaining: data.wallet.faucetCooldownRemaining,
          }));
          setTransactions(data.transactions || []);
        } else {
          toast.error("Failed to load wallet");
          // Clear invalid wallet
          localStorage.removeItem("klodchain_wallet");
          setWalletAddress(null);
        }
      } catch (error) {
        console.error("Fetch wallet error:", error);
        toast.error("Failed to load wallet");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchWallet();
  }, [walletAddress]);

  // Create new wallet
  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/wallet/create", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("klodchain_wallet", data.wallet.pubkey);
        setWalletAddress(data.wallet.pubkey);
        setWallet({
          pubkey: data.wallet.pubkey,
          privateKey: data.wallet.privateKey,
          balance: 0,
          transactionCount: 0,
          totalReceived: 0,
          totalSent: 0,
          faucetReady: true,
          faucetCooldownRemaining: 0,
        });
        setTransactions([]);
        setShowPrivateKey(true);
        toast.success("Wallet created!");
      } else {
        toast.error(data.error || "Failed to create wallet");
      }
    } catch (error) {
      console.error("Create wallet error:", error);
      toast.error("Failed to create wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Import wallet
  const handleImportWallet = async () => {
    if (!importKey || importKey.length !== 64) {
      toast.error("Invalid private key (64 characters required)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/wallet/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateKey: importKey }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("klodchain_wallet", data.wallet.pubkey);
        setWalletAddress(data.wallet.pubkey);
        setImportKey("");
        toast.success("Wallet imported!");
      } else {
        toast.error(data.error || "Wallet not found");
      }
    } catch (error) {
      console.error("Import wallet error:", error);
      toast.error("Failed to import wallet");
    } finally {
      setIsLoading(false);
    }
  };

  // Claim faucet
  const handleClaimFaucet = async () => {
    if (!walletAddress || !wallet) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/wallet/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubkey: walletAddress }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Claimed $${data.amount} USDK!`);

        // Update wallet state with new data
        setWallet((prev) => prev ? {
          ...prev,
          balance: data.newBalance,
          transactionCount: prev.transactionCount + 1,
          totalReceived: prev.totalReceived + data.amount,
          faucetReady: false,
          faucetCooldownRemaining: 24 * 60 * 60 * 1000,
        } : prev);

        // Add new transaction to list
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
      } else {
        toast.error(data.error || "Failed to claim faucet");
      }
    } catch (error) {
      console.error("Faucet claim error:", error);
      toast.error("Failed to claim faucet");
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    localStorage.removeItem("klodchain_wallet");
    setWalletAddress(null);
    setWallet(null);
    setTransactions([]);
    setShowPrivateKey(false);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: "address" | "key") => {
    await navigator.clipboard.writeText(text);
    if (type === "address") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 15)}...${address.slice(-8)}`;
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Format cooldown
  const formatCooldown = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Loading state with skeletons
  if (isPageLoading && walletAddress) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-xl">
        {/* Balance Skeleton */}
        <Card className="border-primary/30 mb-4">
          <CardContent className="py-6 text-center">
            <Skeleton className="h-3 w-24 mx-auto mb-3" />
            <Skeleton className="h-10 w-48 mx-auto mb-2" />
            <Skeleton className="h-3 w-40 mx-auto" />
          </CardContent>
        </Card>

        {/* Action Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>

        {/* Faucet Info Skeleton */}
        <Card className="mb-4">
          <CardContent className="py-3 flex justify-between items-center">
            <div>
              <Skeleton className="h-3 w-12 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="text-right">
              <Skeleton className="h-3 w-12 mb-2 ml-auto" />
              <Skeleton className="h-5 w-16 ml-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4 text-center">
                <Skeleton className="h-3 w-16 mx-auto mb-2" />
                <Skeleton className="h-6 w-8 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transactions Skeleton */}
        <Card className="mb-4">
          <CardContent className="py-4">
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Not connected - Show create/import view
  if (!walletAddress) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Card className="border-primary/30 mb-6">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted border border-primary/50 flex items-center justify-center">
              <div className="w-8 h-8 rotate-45 bg-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              klodchain Wallet
            </h1>
            <p className="text-muted-foreground">
              Create or import your wallet
            </p>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="py-6">
            <h2 className="font-bold text-foreground mb-2">Create New Wallet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a new klodchain wallet
            </p>
            <Button
              onClick={handleCreateWallet}
              disabled={isLoading}
              className="w-full uppercase tracking-wider"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Wallet
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="py-6">
            <h2 className="font-bold text-foreground mb-2">Import Wallet</h2>
            <Input
              placeholder="Enter your private key (64 chars)"
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              className="mb-4 text-sm"
              type="password"
            />
            <Button
              onClick={handleImportWallet}
              disabled={isLoading || !importKey}
              variant="outline"
              className="w-full uppercase tracking-wider"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Import Wallet
            </Button>
          </CardContent>
        </Card>

        <Link href="/wallet/leaderboard">
          <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="py-4 text-center">
              <span className="text-muted-foreground text-sm">
                View Leaderboard &rarr;
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  // Connected - Show dashboard
  return (
    <div className="container mx-auto px-4 py-6 max-w-xl">
      {/* Balance Card */}
      <Card className="border-primary/30 mb-4">
        <CardContent className="py-6 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Total Balance
          </p>
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-4xl font-bold text-foreground">
              ${wallet?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
            </span>
            <span className="text-xl text-primary">USDK</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <span>{formatAddress(walletAddress)}</span>
            <button
              onClick={() => copyToClipboard(walletAddress, "address")}
              className="text-primary hover:text-primary/80"
            >
              {copiedAddress ? <Check className="w-3 h-3" /> : <span className="uppercase">Copy</span>}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Private Key Warning */}
      {showPrivateKey && wallet?.privateKey && (
        <Card className="bg-destructive/10 border-destructive/50 mb-4">
          <CardContent className="py-4">
            <p className="text-destructive text-xs uppercase tracking-wider mb-2">
              Save Your Private Key
            </p>
            <p className="text-muted-foreground text-sm mb-3">
              This is shown only once. Save it securely!
            </p>
            <div className="bg-background rounded p-3 mb-3 text-xs text-foreground break-all font-mono">
              {wallet.privateKey}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(wallet.privateKey!, "key")}
                variant="outline"
                className="flex-1 uppercase text-xs"
              >
                {copiedKey ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
              </Button>
              <Button
                onClick={() => setShowPrivateKey(false)}
                className="flex-1 uppercase text-xs"
              >
                I Saved It
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link href="/wallet/send">
          <Button className="w-full uppercase tracking-wider h-14">
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </Link>
        {wallet?.faucetReady ? (
          <Button
            onClick={handleClaimFaucet}
            disabled={isLoading}
            variant="outline"
            className="w-full uppercase tracking-wider h-14"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Claiming..." : "Claim Faucet"}
          </Button>
        ) : (
          <Button disabled variant="outline" className="w-full uppercase tracking-wider h-14">
            <Clock className="w-4 h-4 mr-2" />
            {formatCooldown(wallet?.faucetCooldownRemaining ?? 0)}
          </Button>
        )}
      </div>

      {/* Faucet Info */}
      <Card className="mb-4">
        <CardContent className="py-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Faucet</p>
            <p className="text-foreground">$130 USDK / 24h</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">Status</p>
            {wallet?.faucetReady ? (
              <p className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" /> Ready
              </p>
            ) : (
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatCooldown(wallet?.faucetCooldownRemaining ?? 0)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Transactions</p>
            <p className="text-xl text-foreground">{wallet?.transactionCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Received</p>
            <p className="text-xl text-foreground">${wallet?.totalReceived?.toFixed(2) ?? '0.00'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-1">Sent</p>
            <p className="text-xl text-foreground">${wallet?.totalSent?.toFixed(2) ?? '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <h3 className="font-bold text-foreground uppercase text-sm mb-3">
            Recent Transactions
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 rotate-45 bg-muted mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <Link
                  key={tx.signature}
                  href={`/explorer/tx/${tx.signature}`}
                  className="flex items-center justify-between bg-muted/50 rounded p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.to_pubkey === walletAddress
                          ? "bg-green-500/20 text-green-400"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {tx.to_pubkey === walletAddress ? (
                        <ArrowDownToLine className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-foreground text-sm">
                        {tx.transaction_type === "faucet_claim" && "Faucet Claim"}
                        {tx.transaction_type === "token_transfer" && (tx.to_pubkey === walletAddress ? "Received" : "Sent")}
                        {tx.transaction_type === "transfer" && (tx.to_pubkey === walletAddress ? "Received" : "Sent")}
                        {tx.transaction_type === "create_account" && "Account Created"}
                        {tx.transaction_type === "program_call" && "Program Call"}
                        {!["faucet_claim", "token_transfer", "transfer", "create_account", "program_call"].includes(tx.transaction_type) &&
                          tx.transaction_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className={tx.to_pubkey === walletAddress ? "text-green-400" : "text-destructive"}>
                    {tx.to_pubkey === walletAddress ? "+" : "-"}${tx.amount} USDK
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/wallet/leaderboard">
          <Button variant="outline" className="w-full uppercase tracking-wider">
            Leaderboard
          </Button>
        </Link>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 uppercase tracking-wider"
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
}
