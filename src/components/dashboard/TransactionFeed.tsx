"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulationStore } from "@/stores/simulation-store";
import {
  shortenHash,
  shortenPubkey,
  formatSol,
} from "@/lib/utils/formatters";
import type { Transaction } from "@/types";
import { ArrowRight, Receipt } from "lucide-react";

function TransactionCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

function TransactionCard({ tx }: { tx: Transaction }) {
  return (
    <Link
      href={`/explorer/tx/${tx.signature}`}
      className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm">
              {shortenHash(tx.signature, 8)}
            </span>
            <Badge
              variant={
                tx.status === "confirmed"
                  ? "success"
                  : tx.status === "failed"
                  ? "destructive"
                  : "secondary"
              }
              className={`text-xs ${tx.status === "pending" ? "animate-pulse" : ""}`}
            >
              {tx.status}
            </Badge>
          </div>
          <div className="pt-4 sm:pt-0 flex items-center gap-1 text-xs text-muted-foreground truncate">
            <span className="font-mono">{shortenPubkey(tx.from_pubkey, 4)}</span>
            {tx.to_pubkey && (
              <>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="font-mono">{shortenPubkey(tx.to_pubkey, 4)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        {tx.amount && (
          <div className="font-mono text-sm">{formatSol(tx.amount, 4)} KLOD</div>
        )}
        <div className="text-xs text-muted-foreground">
          Fee: {formatSol(tx.fee, 6)} KLOD
        </div>
        <div className="text-xs text-muted-foreground">
          Slot #{tx.slot?.toLocaleString() ?? "pending"}
        </div>
      </div>
    </Link>
  );
}

export function TransactionFeed() {
  const { recentTransactions, isInitialized } = useSimulationStore();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {!isInitialized ? (
              [...Array(6)].map((_, i) => <TransactionCardSkeleton key={i} />)
            ) : recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet.
              </p>
            ) : (
              recentTransactions.map((tx) => (
                <TransactionCard key={tx.id} tx={tx} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
