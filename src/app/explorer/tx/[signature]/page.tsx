"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowRight, Receipt, CheckCircle, Clock, XCircle } from "lucide-react";

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

                {tx.amount !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="font-mono text-lg font-semibold">
                      {formatSol(tx.amount, 4)} KLOD
                    </p>
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

        {/* Transfer Details */}
        {tx.transaction_type === "transfer" && (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">From</p>
                  <p className="font-mono text-sm break-all">{tx.from_pubkey}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />
                <div className="flex-1 p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">To</p>
                  <p className="font-mono text-sm break-all">{tx.to_pubkey || "-"}</p>
                </div>
              </div>

              {tx.amount !== null && (
                <div className="mt-4 p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Amount Transferred</p>
                  <p className="text-2xl font-bold">{formatSol(tx.amount, 4)} KLOD</p>
                </div>
              )}
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
