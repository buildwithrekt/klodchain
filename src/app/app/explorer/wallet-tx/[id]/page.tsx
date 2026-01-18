import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Clock, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface WalletTransaction {
  id: string;
  from_pubkey: string | null;
  to_pubkey: string;
  amount: number;
  transaction_type: string;
  created_at: string;
}

async function getWalletTransaction(id: string): Promise<WalletTransaction | null> {
  const { data } = await supabaseAdmin
    .from("wallet_transactions")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export default async function WalletTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tx = await getWalletTransaction(id);

  if (!tx) {
    notFound();
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back Button */}
      <Link
        href="/explorer"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explorer
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">
            Wallet Transaction
          </h1>
          <Badge variant={tx.transaction_type === "faucet_claim" ? "success" : "default"}>
            {tx.transaction_type === "faucet_claim" ? "Faucet Claim" : "Transfer"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm break-all">{tx.id}</p>
      </div>

      {/* Transaction Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground">Amount</span>
            <span className="text-2xl font-bold text-primary">
              {tx.amount.toLocaleString()} $klodchain
            </span>
          </div>

          {/* Type */}
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground">Type</span>
            <span className="text-foreground capitalize">
              {tx.transaction_type.replace("_", " ")}
            </span>
          </div>

          {/* Timestamp */}
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timestamp
            </span>
            <span className="text-foreground">{formatDate(tx.created_at)}</span>
          </div>

          {/* From */}
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              From
            </span>
            {tx.from_pubkey ? (
              <Link
                href={`/accounts/${tx.from_pubkey}`}
                className="text-primary hover:underline"
              >
                {formatAddress(tx.from_pubkey)}
              </Link>
            ) : (
              <span className="text-green-400">Faucet</span>
            )}
          </div>

          {/* To */}
          <div className="flex justify-between items-center py-3">
            <span className="text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              To
            </span>
            <Link
              href={`/accounts/${tx.to_pubkey}`}
              className="text-primary hover:underline"
            >
              {formatAddress(tx.to_pubkey)}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Visual Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
            Transaction Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {/* From */}
            <div className="flex-1">
              <Card className="bg-muted/50">
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">From</p>
                  {tx.from_pubkey ? (
                    <Link
                      href={`/accounts/${tx.from_pubkey}`}
                      className="text-sm text-foreground hover:text-primary break-all"
                    >
                      {formatAddress(tx.from_pubkey)}
                    </Link>
                  ) : (
                    <p className="text-sm text-green-400">Faucet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-6 h-6 text-primary" />
              <span className="text-xs text-muted-foreground">
                {tx.amount} $klodchain
              </span>
            </div>

            {/* To */}
            <div className="flex-1">
              <Card className="bg-muted/50">
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">To</p>
                  <Link
                    href={`/accounts/${tx.to_pubkey}`}
                    className="text-sm text-foreground hover:text-primary break-all"
                  >
                    {formatAddress(tx.to_pubkey)}
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
