"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Coins } from "lucide-react";
import { SOLANA_CONSTANTS } from "@/lib/utils/constants";
import { useChartColors } from "@/hooks/useChartColors";

interface StakeDistributionProps {
  data: Array<{
    name: string;
    stake: number;
  }>;
  loading?: boolean;
}

export function StakeDistribution({ data, loading }: StakeDistributionProps) {
  const colors = useChartColors();
  const COLORS = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.chart1];
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Coins className="h-4 w-4 text-purple-400" />
            Stake Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((v) => ({
    name: v.name,
    value: v.stake / SOLANA_CONSTANTS.LAMPORTS_PER_KLOD,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Coins className="h-4 w-4 text-purple-400" />
          Stake Distribution
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
                formatter={(value: number) => [`${value.toFixed(0)} KLOD`, "Stake"]}
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
