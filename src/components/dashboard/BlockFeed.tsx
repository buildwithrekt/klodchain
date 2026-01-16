"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/stores/simulation-store";
import { shortenHash, shortenPubkey, formatTimestamp } from "@/lib/utils/formatters";
import type { Block } from "@/types";
import { Blocks } from "lucide-react";

function BlockCard({ block }: { block: Block }) {
  return (
    <Link
      href={`/explorer/block/${block.slot}`}
      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Blocks className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">
              #{block.slot.toLocaleString()}
            </span>
            <Badge variant="outline" className="text-xs">
              {block.transaction_count} txs
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {shortenHash(block.blockhash, 12)}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground">
          Leader: {shortenPubkey(block.leader_pubkey, 6)}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTimestamp(block.timestamp)}
        </div>
      </div>
    </Link>
  );
}

export function BlockFeed() {
  const { recentBlocks } = useSimulationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new blocks arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [recentBlocks.length]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Blocks className="h-5 w-5" />
          Recent Blocks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-2">
            {recentBlocks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No blocks yet. Start the simulation to see blocks.
              </p>
            ) : (
              recentBlocks.map((block) => (
                <BlockCard key={block.id} block={block} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
