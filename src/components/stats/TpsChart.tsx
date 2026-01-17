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
import { Activity } from "lucide-react";
import { useChartColors } from "@/hooks/useChartColors";

interface TpsChartProps {
  data: Array<{ slot: number; tps: number; recorded_at: string }>;
  loading?: boolean;
}

export function TpsChart({ data, loading }: TpsChartProps) {
  const colors = useChartColors();
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            TPS History
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
    tps: d.tps || 0,
    slot: d.slot,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          TPS History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.chart1} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.chart1} stopOpacity={0} />
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
                formatter={(value: number) => [`${value.toFixed(2)} TPS`, "TPS"]}
              />
              <Area
                type="monotone"
                dataKey="tps"
                stroke={colors.chart1}
                fill="url(#tpsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
