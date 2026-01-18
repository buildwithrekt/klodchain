"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Copy, ExternalLink, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";

export function WalletButton() {
  const router = useRouter();
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch SOL balance
  useEffect(() => {
    if (publicKey && connection) {
      const fetchBalance = async () => {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setBalance(null);
        }
      };
      fetchBalance();

      // Set up subscription for balance updates
      const subscriptionId = connection.onAccountChange(
        publicKey,
        (accountInfo) => {
          setBalance(accountInfo.lamports / 1e9);
        }
      );

      return () => {
        connection.removeAccountChangeListener(subscriptionId);
      };
    } else {
      setBalance(null);
    }
  }, [publicKey, connection]);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleChangeWallet = async () => {
    await disconnect();
    setTimeout(() => setVisible(true), 100);
  };

  const handleDisconnect = async () => {
    await disconnect();
    toast.success("Wallet disconnected");
  };

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast.success("Address copied");
    }
  };

  const handleViewOnSolscan = () => {
    if (publicKey) {
      window.open(`https://solscan.io/account/${publicKey.toString()}`, "_blank");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatBalance = (bal: number) => {
    if (bal >= 1000) return `${(bal / 1000).toFixed(2)}K`;
    if (bal >= 1) return bal.toFixed(2);
    if (bal >= 0.001) return bal.toFixed(4);
    return bal.toFixed(6);
  };

  if (!connected || !publicKey) {
    return (
      <Button onClick={handleConnect} variant="outline" size="sm" className="gap-2">
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Connect</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-mono">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{formatAddress(publicKey.toString())}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Balance */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-lg font-bold font-mono">
              {balance !== null ? `${formatBalance(balance)} SOL` : "Loading..."}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Wallet info */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              {wallet?.adapter.name || "Wallet"}
            </p>
            <p className="font-mono text-xs truncate">
              {publicKey.toString()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/app/profile")} className="cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewOnSolscan} className="cursor-pointer">
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Solscan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleChangeWallet} className="cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          Change Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
