"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBlocks } from "@/hooks/useBlocks";
import { useTransactions } from "@/hooks/useTransactions";
import { shortenHash, shortenPubkey, formatSol, formatTimestamp } from "@/lib/utils/formatters";
import { Search, Blocks, Receipt, ArrowRight, Loader2 } from "lucide-react";

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const router = useRouter();
  const { blocks, loading: blocksLoading } = useBlocks(20);
  const { transactions, loading: txLoading } = useTransactions(20);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (data.type === "not_found") {
        setSearchError("No results found for this query");
      } else if (data.url) {
        router.push(data.url);
      } else {
        setSearchError("Search failed");
      }
    } catch {
      setSearchError("Search failed");
    } finally {
      setSearching(false);
    }
  };

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
            <BreadcrumbPage>Explorer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by slot, blockhash, signature, pubkey, program..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchError(null);
                  }}
                  className="pl-10"
                  disabled={searching}
                />
              </div>
              <Button type="submit" disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </form>
            {searchError && (
              <p className="text-sm text-destructive mt-2">{searchError}</p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="blocks">
          <TabsList>
            <TabsTrigger value="blocks" className="gap-2">
              <Blocks className="h-4 w-4" />
              Blocks
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Blocks Tab */}
          <TabsContent value="blocks">
            <Card>
              <CardHeader>
                <CardTitle>Recent Blocks</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slot</TableHead>
                      <TableHead>Block Hash</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocksLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading blocks...
                        </TableCell>
                      </TableRow>
                    ) : blocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No blocks yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      blocks.map((block) => (
                        <TableRow key={block.id}>
                          <TableCell>
                            <Link
                              href={`/explorer/block/${block.slot}`}
                              className="font-mono text-primary hover:underline"
                            >
                              #{block.slot.toLocaleString()}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {shortenHash(block.blockhash, 12)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {shortenPubkey(block.leader_pubkey, 6)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{block.transaction_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {formatTimestamp(block.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Signature</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From / To</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading transactions...
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No transactions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx.id}>
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
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                tx.status === "confirmed"
                                  ? "success"
                                  : tx.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
