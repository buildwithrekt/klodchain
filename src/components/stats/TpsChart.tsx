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

interface TpsChartProps {
  data: Array<{ slot: number; tps: number; recorded_at: string }>;
  loading?: boolean;
}

export function TpsChart({ data, loading }: TpsChartProps) {
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
                  <stop offset="5%" stopColor="hsl(180, 77%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(180, 77%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(191, 58%, 21%)" />
              <XAxis
                dataKey="index"
                tick={{ fill: "hsl(180, 77%, 60%)", fontSize: 10 }}
                tickLine={{ stroke: "hsl(191, 58%, 21%)" }}
                axisLine={{ stroke: "hsl(191, 58%, 21%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(180, 77%, 60%)", fontSize: 10 }}
                tickLine={{ stroke: "hsl(191, 58%, 21%)" }}
                axisLine={{ stroke: "hsl(191, 58%, 21%)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(192, 51%, 10%)",
                  border: "1px solid hsl(191, 58%, 21%)",
                  borderRadius: "4px",
                  color: "hsl(180, 77%, 60%)",
                }}
                labelFormatter={(i) => `Slot ${chartData[i]?.slot || i}`}
                formatter={(value: number) => [`${value.toFixed(2)} TPS`, "TPS"]}
              />
              <Area
                type="monotone"
                dataKey="tps"
                stroke="hsl(180, 77%, 60%)"
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
