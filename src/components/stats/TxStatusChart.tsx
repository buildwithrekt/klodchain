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
  Cell,
} from "recharts";
import { CheckCircle } from "lucide-react";

interface TxStatusChartProps {
  data: Array<{ status: string; count: number }>;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "hsl(142, 76%, 46%)",
  pending: "hsl(38, 92%, 50%)",
  failed: "hsl(0, 84%, 60%)",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  failed: "Failed",
};

export function TxStatusChart({ data, loading }: TxStatusChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Transaction Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.count,
    status: d.status,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          Transaction Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(191, 58%, 21%)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(180, 77%, 60%)", fontSize: 11 }}
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
                formatter={(value: number) => [`${value} txs`, "Count"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || "hsl(180, 77%, 60%)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
