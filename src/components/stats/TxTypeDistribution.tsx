"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Layers } from "lucide-react";
import { useChartColors } from "@/hooks/useChartColors";

interface TxTypeDistributionProps {
  data: Array<{ type: string; count: number }>;
  loading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  transfer: "Transfer",
  token_transfer: "Token Transfer",
  create_account: "Create Account",
  program_call: "Program Call",
  stake: "Stake",
  vote: "Vote",
  faucet_claim: "Faucet Claim",
  token_create: "Token Create",
  token_buy: "Token Buy",
  token_sell: "Token Sell",
};

export function TxTypeDistribution({ data, loading }: TxTypeDistributionProps) {
  const colors = useChartColors();
  const COLORS = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5];

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
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px",
                  color: colors.foreground,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: colors.foreground }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
