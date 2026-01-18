"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  pubkey: string;
  balance: number;
  transactionCount: number;
  isCurrentWallet: boolean;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentWalletRank, setCurrentWalletRank] = useState<LeaderboardEntry | null>(null);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("klodchain_wallet");
    setCurrentWallet(stored);

    const fetchLeaderboard = async () => {
      try {
        const url = stored
          ? `/api/wallet/leaderboard?wallet=${stored}`
          : "/api/wallet/leaderboard";
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setLeaderboard(data.leaderboard);
          setCurrentWalletRank(data.currentWalletRank);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 15)}...`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back Button */}
      <Link
        href="/wallet"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Leaderboard Card */}
      <Card>
        <CardContent className="py-6">
          <h1 className="text-xl font-bold text-primary text-center mb-2">
            Wallet Leaderboard
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Top $klodchain holders on klodchain
          </p>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 rotate-45 bg-muted mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No wallets yet</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <div className="col-span-2">Rank</div>
                <div className="col-span-5">Address</div>
                <div className="col-span-3 text-right">Balance</div>
                <div className="col-span-2 text-right">TXs</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border/50">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.pubkey}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${
                      entry.isCurrentWallet
                        ? "bg-primary/10 border-l-2 border-primary"
                        : ""
                    }`}
                  >
                    <div className="col-span-2">
                      <span
                        className={
                          entry.rank <= 3 ? "text-primary" : "text-muted-foreground"
                        }
                      >
                        #{entry.rank}
                      </span>
                    </div>
                    <div className="col-span-5">
                      <Link
                        href={`/accounts/${entry.pubkey}`}
                        className={`text-sm hover:text-primary transition-colors ${
                          entry.isCurrentWallet ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {formatAddress(entry.pubkey)}
                        {entry.isCurrentWallet && (
                          <span className="text-primary ml-1">(you)</span>
                        )}
                      </Link>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-foreground font-medium">
                        {entry.balance.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-muted-foreground">
                        {entry.transactionCount}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Current wallet rank if not in top list */}
                {currentWalletRank && !leaderboard.some((e) => e.isCurrentWallet) && (
                  <>
                    <div className="px-4 py-2 text-center text-muted-foreground text-xs">
                      ...
                    </div>
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center bg-primary/10 border-l-2 border-primary">
                      <div className="col-span-2">
                        <span className="text-muted-foreground">
                          #{currentWalletRank.rank}
                        </span>
                      </div>
                      <div className="col-span-5">
                        <span className="text-sm text-primary">
                          {formatAddress(currentWalletRank.pubkey)}
                          <span className="ml-1">(you)</span>
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-foreground font-medium">
                          {currentWalletRank.balance.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-muted-foreground">
                          {currentWalletRank.transactionCount}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
