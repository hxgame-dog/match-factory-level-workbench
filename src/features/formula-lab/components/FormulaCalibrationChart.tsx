"use client";

import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { CalibrationPoint } from "@/lib/analytics/compareFormulaPlaytestAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PlaytestChartEmpty } from "@/features/playtest";

type ScatterRow = CalibrationPoint & {
  label: string;
  mismatch: boolean;
};

export function FormulaCalibrationChart({
  points,
  summary,
}: {
  points: CalibrationPoint[];
  summary?: { total: number; formulaMismatchCount: number; withActualPassRate: number };
}) {
  const data: ScatterRow[] = points
    .filter((p) => p.formulaP != null && p.actualPassRate != null)
    .map((p) => ({
      ...p,
      label: `${p.levelIndex ?? "-"} · ${p.levelName ?? ""}`,
      mismatch: p.formulaMismatch === "high" || p.formulaMismatch === "medium",
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Formula P vs 真实通关率校准</CardTitle>
        {summary ? (
          <p className="text-xs text-muted-foreground">
            共 {summary.total} 关，有真实通关率 {summary.withActualPassRate} 关，公式偏差 {summary.formulaMismatchCount} 关
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <PlaytestChartEmpty message="暂无校准数据，请先在 Analytics Feedback 导入玩家数据" />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 24, bottom: 12, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="formulaP"
                  name="Formula P"
                  domain={["auto", "auto"]}
                  label={{ value: "Formula P", position: "insideBottom", offset: -4, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="actualPassRate"
                  name="真实通关率"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
                  label={{ value: "真实通关率", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <ZAxis range={[40, 120]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => {
                    if (name === "actualPassRate" && typeof value === "number") {
                      return [`${Math.round(value * 100)}%`, "真实通关率"];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as ScatterRow | undefined;
                    return row?.label ?? "";
                  }}
                />
                <Legend />
                <Scatter name="一致" data={data.filter((d) => !d.mismatch)} fill="#22c55e" />
                <Scatter name="可能偏差" data={data.filter((d) => d.mismatch)} fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          绿色：公式与真实表现较一致；红色：公式低估或高估难度（medium/high）。横轴为 Formula P，纵轴为玩家真实通关率。
        </p>
      </CardContent>
    </Card>
  );
}
