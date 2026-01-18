"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import { listItem } from "@/lib/animations";

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

function TransactionCard({ tx, index }: { tx: Transaction; index: number }) {
  return (
    <motion.div
      variants={listItem}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      transition={{ delay: index * 0.03 }}
    >
      <Link
        href={`/explorer/tx/${tx.signature}`}
        className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <motion.div
            className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Receipt className="h-5 w-5 text-primary" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm">
                {shortenHash(tx.signature, 8)}
              </span>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
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
              </motion.div>
            </div>
            <div className="pt-4 sm:pt-0 flex items-center gap-1 text-xs text-muted-foreground truncate">
              <span className="font-mono">{shortenPubkey(tx.from_pubkey, 4)}</span>
              {tx.to_pubkey && (
                <>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-3 w-3 shrink-0" />
                  </motion.div>
                  <span className="font-mono">{shortenPubkey(tx.to_pubkey, 4)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          {tx.amount && (
            <motion.div
              className="font-mono text-sm"
              key={tx.amount}
              initial={{ scale: 1.1, color: "hsl(var(--primary))" }}
              animate={{ scale: 1, color: "inherit" }}
              transition={{ duration: 0.3 }}
            >
              {formatSol(tx.amount, 4)} KLOD
            </motion.div>
          )}
          <div className="text-xs text-muted-foreground">
            Fee: {formatSol(tx.fee, 6)} KLOD
          </div>
          <div className="text-xs text-muted-foreground">
            Slot #{tx.slot?.toLocaleString() ?? "pending"}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function TransactionFeed() {
  const { recentTransactions, isInitialized } = useSimulationStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Receipt className="h-5 w-5" />
            </motion.div>
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {!isInitialized ? (
                [...Array(6)].map((_, i) => <TransactionCardSkeleton key={i} />)
              ) : recentTransactions.length === 0 ? (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Receipt className="w-6 h-6 text-muted-foreground" />
                  </motion.div>
                  <p className="text-muted-foreground">
                    No transactions yet.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {recentTransactions.map((tx, index) => (
                    <TransactionCard key={tx.id} tx={tx} index={index} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
