"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DifficultyDiagnosisResult } from "@/types/difficulty";

export function DifficultyCurveChart({ results }: { results: DifficultyDiagnosisResult[] }) {
  if (results.length === 0) return <div className="text-sm text-muted-foreground">暂无回放数据</div>;
  const data = results.map((r, idx) => ({ x: idx + 1, name: r.levelName ?? `L${idx + 1}`, P: r.score.P, M: r.score.normalizedM, D: r.score.D, T: r.score.T }));
  return (
    <div className="h-72 rounded-md border border-border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="x" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="P" stroke="#6366f1" strokeWidth={2} /><Line type="monotone" dataKey="M" stroke="#22c55e" /><Line type="monotone" dataKey="D" stroke="#f97316" /><Line type="monotone" dataKey="T" stroke="#0ea5e9" /></LineChart>
      </ResponsiveContainer>
    </div>
  );
}
