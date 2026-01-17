"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CheckCircle } from "lucide-react";
import { useChartColors } from "@/hooks/useChartColors";

interface TxStatusChartProps {
  data: Array<{ slot: number; confirmed: number; pending: number; failed: number }>;
  loading?: boolean;
}

export function TxStatusChart({ data, loading }: TxStatusChartProps) {
  const colors = useChartColors();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Transaction Status Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    slot: d.slot,
    Confirmed: d.confirmed,
    Pending: d.pending,
    Failed: d.failed,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          Transaction Status Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={8} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} opacity={0.3} />
              <XAxis
                dataKey="slot"
                tick={{ fill: colors.foreground, fontSize: 9 }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                tickFormatter={(value) => `${value}`}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: colors.foreground, fontSize: 9 }}
                tickLine={{ stroke: colors.border }}
                axisLine={{ stroke: colors.border }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  color: colors.foreground,
                  fontSize: "12px",
                }}
                labelFormatter={(slot) => `Slot ${slot}`}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: colors.foreground }}
                iconSize={8}
              />
              <Bar
                dataKey="Confirmed"
                stackId="status"
                fill={colors.chart1}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Pending"
                stackId="status"
                fill={colors.chart2}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Failed"
                stackId="status"
                fill="hsl(0, 72%, 50%)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
