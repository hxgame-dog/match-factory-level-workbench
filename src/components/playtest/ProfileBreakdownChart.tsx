"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PlaytestChartEmpty } from "./PlaytestChartEmpty";

export function ProfileBreakdownChart({ rows }: { rows: Array<{ profileName: string; passRate: number }> }) {
  const data = rows.map((r) => ({ ...r, passRatePct: Math.round(r.passRate * 1000) / 10 }));

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-sm">玩家画像通关率</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <PlaytestChartEmpty />
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="profileName" tick={{ fontSize: 11 }} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, "通关率"]} />
                <Bar dataKey="passRatePct" fill="#6366f1" name="通关率" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
