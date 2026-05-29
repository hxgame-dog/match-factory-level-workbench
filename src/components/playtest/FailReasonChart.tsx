"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PlaytestChartEmpty } from "./PlaytestChartEmpty";

const REASON_LABEL: Record<string, string> = {
  timeout: "超时",
  slot_full: "槽位满",
  target_not_found: "找不到目标",
  target_insufficient: "目标不足",
  invalid_level: "无效关卡",
  simulation_error: "模拟错误",
};

export function FailReasonChart({ rows }: { rows: Array<{ reason: string; ratio: number }> }) {
  const data = rows.map((r) => ({
    reason: REASON_LABEL[r.reason] ?? r.reason,
    ratioPct: Math.round(r.ratio * 1000) / 10,
  }));

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-sm">失败原因分布</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <PlaytestChartEmpty message="暂无失败样本或全部通关" />
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                <YAxis unit="%" />
                <Tooltip formatter={(v) => [`${v ?? 0}%`, "占比"]} />
                <Bar dataKey="ratioPct" fill="#0ea5e9" name="占比" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
