"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Blocks, Receipt, ArrowRight, Loader2, User, Code, FileCheck, Wallet, ArrowLeftRight } from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";

interface SearchResult {
  type: "block" | "transaction" | "account" | "validator" | "program" | "wallet" | "wallet_transaction" | "token";
  url: string;
  label: string;
  sublabel?: string;
}

const typeIcons: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  block: Blocks,
  transaction: Receipt,
  account: User,
  validator: FileCheck,
  program: Code,
  wallet: Wallet,
  wallet_transaction: ArrowLeftRight,
  token: Receipt,
};

const typeColors: Record<SearchResult["type"], string> = {
  block: "bg-blue-500/10 text-blue-500",
  transaction: "bg-green-500/10 text-green-500",
  account: "bg-purple-500/10 text-purple-500",
  validator: "bg-orange-500/10 text-orange-500",
  program: "bg-pink-500/10 text-pink-500",
  wallet: "bg-cyan-500/10 text-cyan-500",
  wallet_transaction: "bg-teal-500/10 text-teal-500",
  token: "bg-yellow-500/10 text-yellow-500",
};

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { blocks, loading: blocksLoading } = useBlocks(20);
  const { transactions, loading: txLoading } = useTransactions(20);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await response.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close results on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (url: string) => {
    setShowResults(false);
    setSearchQuery("");
    router.push(url);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-6 space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Breadcrumb */}
      <motion.div variants={staggerItem}>
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
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem} ref={searchRef} className="relative">
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by slot, blockhash, signature, pubkey, program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                className="pl-10 pr-10"
              />
              {searching &&
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              }
            </div>
          </CardContent>
        </Card>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[400px] overflow-auto shadow-lg">
                <CardContent className="p-2">
                  {results.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No results found
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {results.map((result, index) => {
                        const Icon = typeIcons[result.type];
                        return (
                          <motion.button
                            key={`${result.url}-${index}`}
                            onClick={() => handleResultClick(result.url)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ x: 4 }}
                          >
                            <div className={`p-2 rounded-lg ${typeColors[result.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-sm truncate">{result.label}</p>
                              {result.sublabel && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {result.sublabel}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="capitalize text-xs shrink-0">
                              {result.type === "wallet_transaction" ? "wallet tx" : result.type}
                            </Badge>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem}>
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
                          <TableCell>
                            <Link
                              href={`/explorer/block/${block.slot}`}
                              className="font-mono text-sm text-primary hover:underline"
                            >
                              {shortenHash(block.blockhash, 12)}
                            </Link>
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
      </motion.div>
    </motion.div>
  );
}
