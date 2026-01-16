"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet } from "lucide-react";
import { shortenPubkey } from "@/lib/utils/formatters";
import Link from "next/link";

interface TopAccountsProps {
  data: Array<{ pubkey: string; txCount: number }>;
  loading?: boolean;
}

export function TopAccounts({ data, loading }: TopAccountsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-cyan-400" />
            Top Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4 text-cyan-400" />
          Top Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="text-xs">#</TableHead>
              <TableHead className="text-xs">Account</TableHead>
              <TableHead className="text-xs text-right">Transactions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((account, index) => (
              <TableRow key={account.pubkey} className="border-border/50">
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/explorer?q=${account.pubkey}`}
                    className="font-mono text-sm hover:text-primary transition-colors"
                  >
                    {shortenPubkey(account.pubkey, 6)}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {account.txCount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
