"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = () => {
    setVisible(true);
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

  if (!connected || !publicKey) {
    return (
      <Button onClick={handleConnect} variant="outline" size="sm" className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          {formatAddress(publicKey.toString())}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewOnSolscan} className="cursor-pointer">
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Solscan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
