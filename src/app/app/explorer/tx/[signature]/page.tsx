"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/client";
import { formatSol, formatTimestamp, shortenHash } from "@/lib/utils/formatters";
import type { Transaction } from "@/types";
import { ArrowRight, Receipt, CheckCircle, Clock, XCircle, ExternalLink, TrendingDown, TrendingUp } from "lucide-react";

// Helper to format KLOD token amount (6 decimals)
function formatKlodAmount(amount: number | null, instructionData: Record<string, unknown> | null): string {
  // For token transfers, use the human-readable amount from instruction_data
  if (instructionData?.amount !== undefined) {
    return Number(instructionData.amount).toLocaleString();
  }
  // Fallback: divide by 10^6 for token transfers
  if (amount !== null) {
    return (amount / 1_000_000).toLocaleString();
  }
  return "0";
}

export default function TransactionDetailPage() {
  const params = useParams();
  const signature = params.signature as string;
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("signature", signature)
        .single();

      setTx(data);
      setLoading(false);
    };

    fetchData();
  }, [signature, supabase]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Transaction not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon =
    tx.status === "confirmed"
      ? CheckCircle
      : tx.status === "pending"
      ? Clock
      : XCircle;

  const statusColor =
    tx.status === "confirmed"
      ? "text-green-500"
      : tx.status === "pending"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/explorer">Explorer</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>TX {shortenHash(signature, 8)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Transaction Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Transaction Details</h1>
            <p className="text-muted-foreground text-sm font-mono break-all">
              {tx.signature}
            </p>
          </div>
          <div className={`flex items-center gap-2 ${statusColor}`}>
            <StatusIcon className="h-5 w-5" />
            <Badge
              variant={
                tx.status === "confirmed"
                  ? "success"
                  : tx.status === "pending"
                  ? "secondary"
                  : "destructive"
              }
              className="text-sm"
            >
              {tx.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Signature</p>
                  <p className="font-mono text-sm break-all">{tx.signature}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Block</p>
                  {tx.slot !== null ? (
                    <Link
                      href={`/explorer/block/${tx.slot}`}
                      className="text-primary hover:underline font-mono"
                    >
                      #{tx.slot.toLocaleString()}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Timestamp</p>
                  <p>{tx.confirmed_at ? formatTimestamp(tx.confirmed_at) : "Pending"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <Badge variant="outline" className="capitalize">
                    {tx.transaction_type.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fee</p>
                  <p className="font-mono">{formatSol(tx.fee, 6)} KLOD</p>
                </div>

                {(tx.amount !== null || tx.instruction_data?.amount !== undefined) && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="font-mono text-lg font-semibold">
                      {formatKlodAmount(tx.amount, tx.instruction_data as Record<string, unknown> | null)} KLOD
                    </p>
                  </div>
                )}

                {tx.program_id && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Program ID</p>
                    <p className="font-mono text-sm break-all">{tx.program_id}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p>{formatTimestamp(tx.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Details with Tabs */}
        {(tx.transaction_type === "transfer" || tx.transaction_type === "token_transfer" || tx.transaction_type === "faucet_claim") && (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="balance">Balance Changes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 rounded-lg border bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">From</p>
                      {tx.from_pubkey === "FAUCET" ? (
                        <p className="font-mono text-sm text-green-500">Klodchain Faucet</p>
                      ) : (
                        <Link href={`/accounts/${tx.from_pubkey}`} className="font-mono text-sm break-all text-primary hover:underline">
                          {tx.from_pubkey}
                        </Link>
                      )}
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />
                    <div className="flex-1 p-4 rounded-lg border bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">To</p>
                      {tx.to_pubkey ? (
                        <Link href={`/accounts/${tx.to_pubkey}`} className="font-mono text-sm break-all text-primary hover:underline">
                          {tx.to_pubkey}
                        </Link>
                      ) : (
                        <p className="font-mono text-sm">-</p>
                      )}
                    </div>
                  </div>

                  {(tx.amount !== null || tx.instruction_data?.amount !== undefined) && (
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Amount Transferred</p>
                      <p className="text-2xl font-bold">{formatKlodAmount(tx.amount, tx.instruction_data as Record<string, unknown> | null)} KLOD</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="balance" className="mt-4">
                  <div className="space-y-3">
                    {/* Sender Balance Change (skip for faucet) */}
                    {tx.from_pubkey !== "FAUCET" && (
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Sender</p>
                            <Link href={`/accounts/${tx.from_pubkey}`} className="font-mono text-sm text-primary hover:underline">
                              {shortenHash(tx.from_pubkey, 8)}
                            </Link>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-semibold text-red-500">
                            -{formatKlodAmount(tx.amount, tx.instruction_data as Record<string, unknown> | null)} KLOD
                          </p>
                          <p className="text-xs text-muted-foreground">+ {formatSol(tx.fee, 6)} fee</p>
                        </div>
                      </div>
                    )}

                    {/* Faucet source */}
                    {tx.from_pubkey === "FAUCET" && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Source</p>
                            <p className="font-mono text-sm text-green-500">Klodchain Faucet</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-semibold text-green-500">
                            +{formatKlodAmount(tx.amount, tx.instruction_data as Record<string, unknown> | null)} KLOD
                          </p>
                          <p className="text-xs text-muted-foreground">Free tokens</p>
                        </div>
                      </div>
                    )}

                    {/* Recipient Balance Change */}
                    {tx.to_pubkey && (
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Recipient</p>
                            <Link href={`/accounts/${tx.to_pubkey}`} className="font-mono text-sm text-primary hover:underline">
                              {shortenHash(tx.to_pubkey, 8)}
                            </Link>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-semibold text-green-500">
                            +{formatKlodAmount(tx.amount, tx.instruction_data as Record<string, unknown> | null)} KLOD
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Raw Data */}
        {tx.instruction_data && (
          <Card>
            <CardHeader>
              <CardTitle>Instruction Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-muted overflow-auto text-sm">
                {JSON.stringify(tx.instruction_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
