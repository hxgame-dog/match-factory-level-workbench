"use client";

import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DifficultyDiagnosisResult } from "@/types/difficulty";

export function DistributionCharts({ diagnosis }: { diagnosis?: DifficultyDiagnosisResult | null }) {
  if (!diagnosis) return <div className="text-sm text-muted-foreground">暂无图表数据</div>;
  const complexityData = Object.entries(diagnosis.breakdown.itemComplexity).map(([name, value]) => ({ name, value }));
  const sizeData = Object.entries(diagnosis.breakdown.distribution.sizeDistribution).map(([name, value]) => ({ name, value }));
  const colorData = Object.entries(diagnosis.breakdown.distribution.colorDistribution).map(([name, value]) => ({ name, value }));
  const bucketData = Object.entries(diagnosis.breakdown.similarity.bucketCounts).map(([name, value]) => ({ name, value }));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-64 rounded-md border border-border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={complexityData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" fill="#6366f1" /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 rounded-md border border-border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bucketData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0ea5e9" /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 rounded-md border border-border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Tooltip /><Legend /><Pie data={sizeData} dataKey="value" nameKey="name" fill="#22c55e" /></PieChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 rounded-md border border-border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={colorData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#f97316" /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
