"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulationStore } from "@/stores/simulation-store";
import { shortenHash, shortenPubkey, formatTimestamp } from "@/lib/utils/formatters";
import type { Block } from "@/types";
import { Blocks } from "lucide-react";
import { listItem, scaleIn } from "@/lib/animations";

function BlockCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-3 w-20 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

function BlockCard({ block, index }: { block: Block; index: number }) {
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
        href={`/explorer/block/${block.slot}`}
        className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <motion.div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Blocks className="h-5 w-5 text-primary" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold">
                #{block.slot.toLocaleString()}
              </span>
              <Badge variant="outline" className="text-xs">
                {block.transaction_count} txs
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {shortenHash(block.blockhash, 12)}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">
            Leader: {shortenPubkey(block.leader_pubkey, 6)}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTimestamp(block.timestamp)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function BlockFeed() {
  const { recentBlocks, isInitialized } = useSimulationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new blocks arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [recentBlocks.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Blocks className="h-5 w-5" />
            </motion.div>
            Recent Blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
            <div className="space-y-2">
              {!isInitialized ? (
                [...Array(6)].map((_, i) => <BlockCardSkeleton key={i} />)
              ) : recentBlocks.length === 0 ? (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center"
                    animate={{ rotate: [0, 45, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Blocks className="w-6 h-6 text-muted-foreground" />
                  </motion.div>
                  <p className="text-muted-foreground">
                    No blocks yet. Start the simulation to see blocks.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {recentBlocks.map((block, index) => (
                    <BlockCard key={block.id} block={block} index={index} />
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
