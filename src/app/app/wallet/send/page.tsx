"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface WalletData {
  pubkey: string;
  balance: number;
}

export default function SendPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load wallet from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("klodchain_wallet");
    if (stored) {
      setWalletAddress(stored);
    } else {
      router.push("/wallet");
    }
  }, [router]);

  // Fetch wallet data
  const fetchWalletData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const res = await fetch(`/api/wallet/${walletAddress}`);
      const data = await res.json();

      if (data.success) {
        setWallet({
          pubkey: data.wallet.pubkey,
          balance: data.wallet.balance,
        });
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchWalletData();
    }
  }, [walletAddress, fetchWalletData]);

  // Handle send
  const handleSend = async () => {
    if (!walletAddress || !wallet) return;

    if (!recipient || !recipient.startsWith("klod_")) {
      toast.error("Invalid recipient address");
      return;
    }

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount (must be positive integer)");
      return;
    }

    if (amountNum > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (recipient === walletAddress) {
      toast.error("Cannot send to yourself");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromPubkey: walletAddress,
          toPubkey: recipient,
          amount: amountNum,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Sent ${amountNum} $klodchain to ${recipient.slice(0, 12)}...`);
        router.push("/wallet");
      } else {
        toast.error(data.error || "Failed to send");
      }
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send");
    } finally {
      setIsLoading(false);
    }
  };

  // Set max amount
  const handleMax = () => {
    if (wallet) {
      setAmount(wallet.balance.toString());
    }
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-6 max-w-xl"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Back Button */}
      <motion.div variants={staggerItem}>
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </Link>
      </motion.div>

      {/* Send Card */}
      <motion.div variants={staggerItem}>
        <Card>
          <CardContent className="py-6">
            <h1 className="text-xl font-bold text-primary mb-4">
              Send $klodchain
            </h1>

            {/* Recipient */}
            <div className="space-y-2 mb-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Recipient Address
              </Label>
              <Input
                placeholder="klod_..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2 mb-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Amount
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-sm">
                  $klodchain
                </span>
              </div>
            </div>

            {/* Available Balance */}
            <div className="flex justify-between items-center mb-6 text-sm">
              <span className="text-muted-foreground">
                Available: {wallet?.balance.toLocaleString() || 0} $klodchain
              </span>
              <button
                onClick={handleMax}
                className="text-primary hover:text-primary/80 uppercase text-xs"
              >
                Max
              </button>
            </div>

            {/* Send Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSend}
                disabled={isLoading || !recipient || !amount}
                className="w-full uppercase tracking-wider h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send $klodchain
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
