"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { shortenHash, shortenPubkey, formatSol, formatTimestamp } from "@/lib/utils/formatters";
import type { Block, Transaction } from "@/types";
import { ArrowLeft, ArrowRight, Blocks, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlockDetailPage() {
  const params = useParams();
  const slot = Number(params.slot);
  const [block, setBlock] = useState<Block | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch block
      const { data: blockData } = await supabase
        .from("blocks")
        .select("*")
        .eq("slot", slot)
        .single();

      if (blockData) {
        setBlock(blockData);

        // Fetch transactions in this block
        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .eq("slot", slot)
          .order("block_index");

        setTransactions(txData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [slot, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="max-w-7xl px-4 mx-auto flex h-14 items-center">
            <Link href="/explorer" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Explorer</span>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="max-w-7xl px-4 mx-auto flex h-14 items-center">
            <Link href="/explorer" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Explorer</span>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Block #{slot.toLocaleString()} not found
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl px-4 mx-auto flex h-14 items-center justify-between">
          <Link href="/explorer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explorer</span>
          </Link>
          <div className="flex items-center gap-2">
            {block.parent_slot !== null && (
              <Link href={`/explorer/block/${block.parent_slot}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              </Link>
            )}
            <Link href={`/explorer/block/${slot + 1}`}>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Block Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Blocks className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Block #{slot.toLocaleString()}</h1>
            <p className="text-muted-foreground">{formatTimestamp(block.timestamp)}</p>
          </div>
        </div>

        {/* Block Details */}
        <Card>
          <CardHeader>
            <CardTitle>Block Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Block Hash</p>
                <p className="font-mono text-sm break-all">{block.blockhash}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Previous Block Hash</p>
                <p className="font-mono text-sm break-all">
                  {block.previous_blockhash || "Genesis Block"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leader</p>
                <p className="font-mono text-sm">{block.leader_pubkey}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PoH Hash</p>
                <p className="font-mono text-sm break-all">{block.poh_hash || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <Badge variant="secondary">{block.transaction_count}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parent Slot</p>
                {block.parent_slot !== null ? (
                  <Link
                    href={`/explorer/block/${block.parent_slot}`}
                    className="text-primary hover:underline"
                  >
                    #{block.parent_slot.toLocaleString()}
                  </Link>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transactions ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No transactions in this block
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From / To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, index) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">{index}</TableCell>
                      <TableCell>
                        <Link
                          href={`/explorer/tx/${tx.signature}`}
                          className="font-mono text-primary hover:underline text-sm"
                        >
                          {shortenHash(tx.signature, 12)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {tx.transaction_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-mono">
                          <span>{shortenPubkey(tx.from_pubkey, 4)}</span>
                          {tx.to_pubkey && (
                            <>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span>{shortenPubkey(tx.to_pubkey, 4)}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {tx.amount ? `${formatSol(tx.amount, 4)} KLOD` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatSol(tx.fee, 6)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
