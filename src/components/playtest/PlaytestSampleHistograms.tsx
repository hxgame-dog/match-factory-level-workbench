"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PlaytestChartEmpty } from "./PlaytestChartEmpty";

function buildHistogram(
  values: number[],
  bucketCount: number,
  label: string,
): Array<{ bucket: string; count: number; label: string }> {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.001);
  const step = span / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    bucket: `${(min + step * i).toFixed(0)}-${(min + step * (i + 1)).toFixed(0)}`,
    count: 0,
    label,
  }));
  for (const v of values) {
    const idx = Math.min(bucketCount - 1, Math.floor((v - min) / step) || 0);
    buckets[idx].count += 1;
  }
  return buckets;
}

export function PlaytestSampleHistograms({
  samples,
}: {
  samples?: Array<{
    passed: boolean;
    remainingTime?: number;
    completionTime?: number;
    moves: number;
  }>;
}) {
  if (!samples?.length) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <PlaytestChartEmpty message="暂无样本分布（单关模拟需开启样本记录）" />
        <PlaytestChartEmpty message="暂无样本分布（单关模拟需开启样本记录）" />
      </div>
    );
  }

  const remaining = samples.map((s) => s.remainingTime).filter((v): v is number => v != null && !Number.isNaN(v));
  const moves = samples.map((s) => s.moves).filter((v) => !Number.isNaN(v));
  const passFail = [
    { name: "通关", count: samples.filter((s) => s.passed).length },
    { name: "失败", count: samples.filter((s) => !s.passed).length },
  ];

  const remainingData = buildHistogram(remaining, 8, "剩余时间(s)");
  const movesData = buildHistogram(moves, 8, "步数");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-md border border-border p-2">
        <p className="mb-2 text-xs font-medium text-foreground">剩余时间分布</p>
        {remaining.length === 0 ? (
          <PlaytestChartEmpty message="无剩余时间样本" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={remainingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" name="样本数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="rounded-md border border-border p-2">
        <p className="mb-2 text-xs font-medium text-foreground">步数分布</p>
        {moves.length === 0 ? (
          <PlaytestChartEmpty message="无步数样本" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" name="样本数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="rounded-md border border-border p-2 md:col-span-2">
        <p className="mb-2 text-xs font-medium text-foreground">通关 / 失败样本数</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={passFail}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#22c55e" name="样本数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
