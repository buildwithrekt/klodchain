"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulationStore } from "@/stores/simulation-store";
import { formatSol, shortenPubkey } from "@/lib/utils/formatters";
import { Users } from "lucide-react";

function ValidatorRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-20 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-8 ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export function ValidatorLeaderboard() {
  const { validators, isInitialized } = useSimulationStore();

  const sortedValidators = [...validators].sort(
    (a, b) => b.stake - a.stake
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Validators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Validator</TableHead>
              <TableHead className="text-right">Stake</TableHead>
              <TableHead className="text-right">Blocks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isInitialized ? (
              [...Array(6)].map((_, i) => <ValidatorRowSkeleton key={i} />)
            ) : (
              sortedValidators.map((validator, index) => (
                <TableRow key={validator.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">#{index + 1}</span>
                      <div>
                        <div className="font-medium">{validator.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {shortenPubkey(validator.pubkey, 6)}
                        </div>
                      </div>
                      {validator.is_active && (
                        <Badge variant="success" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatSol(validator.stake, 2)} KLOD
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {validator.blocks_produced}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
