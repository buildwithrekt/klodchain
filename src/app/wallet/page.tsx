"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Send, Loader2, ArrowRight, Coins } from "lucide-react";
import { toast } from "sonner";

const KLOD_MINT = new PublicKey("8V5ZKPSMixYnBg4t3RtSU9a1daHAh38Pyhea2R3Xpump");
const KLOD_DECIMALS = 6;

interface TokenBalance {
  balance: number;
  symbol: string;
  name: string;
}

interface RecentTransfer {
  signature: string;
  from_pubkey: string;
  to_pubkey: string;
  amount: number;
  created_at: string;
}

export default function WalletPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState<RecentTransfer[]>([]);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      fetchRecentTransfers();
    } else {
      setBalance(null);
      setRecentTransfers([]);
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;
    setIsFetching(true);
    try {
      const res = await fetch(`/api/tokens/balance?wallet=${publicKey.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchRecentTransfers = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`/api/tokens/transfers?wallet=${publicKey.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecentTransfers(data.transfers);
      }
    } catch (error) {
      console.error("Failed to fetch transfers:", error);
    }
  };

  const handleTransfer = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (balance && amountNum > balance.balance) {
      toast.error("Insufficient balance");
      return;
    }

    // Validate recipient address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipient);
    } catch {
      toast.error("Invalid recipient address");
      return;
    }

    setIsLoading(true);
    try {
      // Get sender's token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        KLOD_MINT,
        publicKey
      );

      // Get recipient's token account
      const recipientTokenAccount = await getAssociatedTokenAddress(
        KLOD_MINT,
        recipientPubkey
      );

      // Build transaction
      const transaction = new Transaction();

      // Check if recipient token account exists, if not create it
      try {
        await getAccount(connection, recipientTokenAccount);
      } catch {
        // Account doesn't exist, add instruction to create it
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            recipientTokenAccount, // associated token account
            recipientPubkey, // owner
            KLOD_MINT // mint
          )
        );
      }

      // Add transfer instruction
      const amountInSmallestUnit = Math.floor(amountNum * Math.pow(10, KLOD_DECIMALS));
      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          publicKey,
          amountInSmallestUnit
        )
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      toast.loading("Confirming transaction...");
      await connection.confirmTransaction(signature, "confirmed");

      // Record in klodchain
      await fetch("/api/tokens/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: publicKey.toString(),
          to: recipient,
          amount: amountNum,
          signature: signature,
          solanaSignature: true,
        }),
      });

      toast.success(`Sent ${amountNum} KLOD to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`);
      setRecipient("");
      setAmount("");
      fetchBalance();
      fetchRecentTransfers();
    } catch (error: unknown) {
      console.error("Transfer error:", error);
      if (error instanceof Error && error.message.includes("User rejected")) {
        toast.error("Transaction cancelled");
      } else {
        toast.error("Transfer failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">KLOD Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Send and receive $KLOD tokens
          </p>
        </div>
      </div>

      {/* Connect Wallet */}
      {!connected ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Connect your Solana wallet to send and receive KLOD tokens
            </p>
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                {isFetching ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-4xl font-bold">
                      {balance?.balance.toLocaleString() || "0"}
                    </span>
                    <span className="text-xl text-muted-foreground">KLOD</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Wallet: {publicKey?.toString()}
              </p>
            </CardContent>
          </Card>

          {/* Transfer Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Send className="h-4 w-4" />
                Send KLOD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="Enter Solana wallet address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isLoading}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    KLOD
                  </span>
                </div>
                {balance && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setAmount(balance.balance.toString())}
                  >
                    Max: {balance.balance.toLocaleString()} KLOD
                  </button>
                )}
              </div>
              <Button
                onClick={handleTransfer}
                disabled={isLoading || !recipient || !amount}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send KLOD
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Transfers */}
          {recentTransfers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Recent Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransfers.map((tx) => (
                    <div
                      key={tx.signature}
                      className="flex items-center justify-between text-sm border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        {tx.from_pubkey === publicKey?.toString() ? (
                          <span className="text-red-400">-{tx.amount}</span>
                        ) : (
                          <span className="text-green-400">+{tx.amount}</span>
                        )}
                        <span className="text-muted-foreground">KLOD</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {tx.from_pubkey === publicKey?.toString()
                            ? formatAddress(tx.to_pubkey)
                            : formatAddress(tx.from_pubkey)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Real SPL token transfers on Solana mainnet
            </p>
            <p className="text-xs text-muted-foreground">
              Transactions are also recorded on klodchain
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
