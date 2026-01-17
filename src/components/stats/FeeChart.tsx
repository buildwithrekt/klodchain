"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Coins } from "lucide-react";
import { useChartColors } from "@/hooks/useChartColors";

interface FeeChartProps {
  data: Array<{ slot: number; avgFee: number }>;
  loading?: boolean;
}

export function FeeChart({ data, loading }: FeeChartProps) {
  const colors = useChartColors();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Coins className="h-4 w-4 text-orange-400" />
            Fee Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d, i) => ({
    index: i,
    fee: Math.round(d.avgFee),
    slot: d.slot,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Coins className="h-4 w-4 text-orange-400" />
          Fee Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.chart3} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.chart3} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="index"
                tick={{ fill: colors.foreground, fontSize: 10 }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
              />
              <YAxis
                tick={{ fill: colors.foreground, fontSize: 10 }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px",
                  color: colors.foreground,
                }}
                labelFormatter={(i) => `Slot ${chartData[i]?.slot || i}`}
                formatter={(value: number) => [`${value.toLocaleString()} lamports`, "Avg Fee"]}
              />
              <Area
                type="monotone"
                dataKey="fee"
                stroke={colors.chart3}
                fill="url(#feeGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
