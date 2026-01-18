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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { shortenHash, formatSol, formatTimestamp } from "@/lib/utils/formatters";
import type { Block } from "@/types";
import { Users, Blocks, Coins, Activity, CheckCircle } from "lucide-react";
import { SOLANA_CONSTANTS } from "@/lib/utils/constants";

interface Validator {
  id: string;
  pubkey: string;
  name: string;
  stake: number;
  blocks_produced: number;
  skip_rate: number;
  is_active: boolean;
  created_at: string;
}

interface Agent {
  id: string;
  pubkey: string;
  name: string;
  role: string;
  status: string;
  uptime: number;
  last_active: string;
}

export default function ValidatorDetailPage() {
  const params = useParams();
  const pubkey = params.pubkey as string;
  const [validator, setValidator] = useState<Validator | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch validator
      const { data: validatorData } = await supabase
        .from("validators")
        .select("*")
        .eq("pubkey", pubkey)
        .single();

      if (validatorData) {
        setValidator(validatorData);

        // Fetch matching agent
        const { data: agentData } = await supabase
          .from("agents")
          .select("*")
          .eq("pubkey", pubkey)
          .single();

        if (agentData) {
          setAgent(agentData);
        }

        // Fetch recent blocks produced by this validator
        const { data: blocksData } = await supabase
          .from("blocks")
          .select("*")
          .eq("leader_pubkey", pubkey)
          .order("slot", { ascending: false })
          .limit(20);

        setRecentBlocks(blocksData || []);

        // Get total blocks count
        const { count } = await supabase
          .from("blocks")
          .select("*", { count: "exact", head: true })
          .eq("leader_pubkey", pubkey);

        setTotalBlocks(count || 0);
      }

      setLoading(false);
    };

    fetchData();
  }, [pubkey, supabase]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!validator) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Validator not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const stakeInKlod = validator.stake / SOLANA_CONSTANTS.LAMPORTS_PER_KLOD;

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
            <BreadcrumbPage>Validator {validator.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Validator Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{validator.name}</h1>
            {validator.is_active ? (
              <Badge variant="success" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
          <p className="font-mono text-sm text-muted-foreground break-all">
            {validator.pubkey}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Coins className="h-4 w-4 text-purple-400" />
              Stake
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {stakeInKlod.toLocaleString()} KLOD
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Blocks className="h-4 w-4 text-cyan-400" />
              Blocks Produced
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {totalBlocks.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Activity className="h-4 w-4 text-orange-400" />
              Skip Rate
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {validator.skip_rate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Uptime
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {agent ? `${agent.uptime.toFixed(1)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Info */}
      {agent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="capitalize">{agent.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={agent.status === "active" ? "success" : "secondary"}
                  className="capitalize"
                >
                  {agent.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <div className="flex items-center gap-2">
                  <Progress value={agent.uptime} className="h-2 flex-1" />
                  <span className="text-sm tabular-nums">{agent.uptime.toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Active</p>
                <p className="text-sm">{formatTimestamp(agent.last_active)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Recent Blocks Produced ({recentBlocks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBlocks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No blocks produced yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Block Hash</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBlocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <Link
                        href={`/explorer/block/${block.slot}`}
                        className="text-primary hover:underline font-medium"
                      >
                        #{block.slot.toLocaleString()}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {shortenHash(block.blockhash, 12)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{block.transaction_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatTimestamp(block.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
