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
} from "recharts";
import { Users } from "lucide-react";

interface ValidatorPerformanceProps {
  data: Array<{
    name: string;
    pubkey: string;
    stake: number;
    blocksProduced: number;
    isActive: boolean;
  }>;
  loading?: boolean;
}

export function ValidatorPerformance({ data, loading }: ValidatorPerformanceProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Validator Performance
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
    blocks: v.blocksProduced,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-400" />
          Validator Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(191, 58%, 21%)" />
              <XAxis
                type="number"
                tick={{ fill: "hsl(180, 77%, 60%)", fontSize: 10 }}
                tickLine={{ stroke: "hsl(191, 58%, 21%)" }}
                axisLine={{ stroke: "hsl(191, 58%, 21%)" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(180, 77%, 60%)", fontSize: 11 }}
                tickLine={{ stroke: "hsl(191, 58%, 21%)" }}
                axisLine={{ stroke: "hsl(191, 58%, 21%)" }}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(192, 51%, 10%)",
                  border: "1px solid hsl(191, 58%, 21%)",
                  borderRadius: "4px",
                  color: "hsl(180, 77%, 60%)",
                }}
                formatter={(value: number) => [`${value} blocks`, "Produced"]}
              />
              <Bar
                dataKey="blocks"
                fill="hsl(142, 76%, 46%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
