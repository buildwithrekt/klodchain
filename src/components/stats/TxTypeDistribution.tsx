"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Layers } from "lucide-react";

interface TxTypeDistributionProps {
  data: Array<{ type: string; count: number }>;
  loading?: boolean;
}

const COLORS = [
  "hsl(180, 77%, 60%)",  // cyan - transfer
  "hsl(142, 76%, 46%)",  // green - create_account
  "hsl(38, 92%, 50%)",   // orange - program_call
  "hsl(262, 83%, 58%)",  // purple - stake
  "hsl(0, 84%, 60%)",    // red - vote
];

const TYPE_LABELS: Record<string, string> = {
  transfer: "Transfer",
  create_account: "Create Account",
  program_call: "Program Call",
  stake: "Stake",
  vote: "Vote",
};

export function TxTypeDistribution({ data, loading }: TxTypeDistributionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-400" />
            Transaction Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: TYPE_LABELS[d.type] || d.type,
    value: d.count,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Layers className="h-4 w-4 text-orange-400" />
          Transaction Types
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(192, 51%, 10%)",
                  border: "1px solid hsl(191, 58%, 21%)",
                  borderRadius: "4px",
                  color: "hsl(180, 77%, 60%)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "hsl(180, 77%, 60%)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
