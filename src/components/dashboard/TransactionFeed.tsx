"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/stores/simulation-store";
import {
  shortenHash,
  shortenPubkey,
  formatSol,
  formatTimestamp,
} from "@/lib/utils/formatters";
import type { Transaction } from "@/types";
import { ArrowRight, Receipt } from "lucide-react";

function TransactionCard({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">
              {shortenHash(tx.signature, 8)}
            </span>
            <Badge
              variant={tx.status === "confirmed" ? "success" : "secondary"}
              className="text-xs"
            >
              {tx.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-mono">{shortenPubkey(tx.from_pubkey, 4)}</span>
            {tx.to_pubkey && (
              <>
                <ArrowRight className="h-3 w-3" />
                <span className="font-mono">{shortenPubkey(tx.to_pubkey, 4)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        {tx.amount && (
          <div className="font-mono text-sm">{formatSol(tx.amount, 4)} KLOD</div>
        )}
        <div className="text-xs text-muted-foreground">
          Slot #{tx.slot?.toLocaleString() ?? "pending"}
        </div>
      </div>
    </div>
  );
}

export function TransactionFeed() {
  const { recentTransactions } = useSimulationStore();

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
            {recentTransactions.length === 0 ? (
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
