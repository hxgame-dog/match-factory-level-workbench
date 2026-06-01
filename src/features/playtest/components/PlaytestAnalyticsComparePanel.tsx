"use client";

import { useEffect, useState } from "react";
import type { PlaytestAnalyticsCompareRow } from "@/lib/analytics/buildCalibrationDataset";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MISMATCH_LABEL: Record<string, string> = {
  none: "—",
  low: "轻微",
  medium: "中等",
  high: "高",
};

export function PlaytestAnalyticsComparePanel({
  levelIds,
  triggerKey,
}: {
  levelIds: string[];
  triggerKey?: string;
}) {
  const [rows, setRows] = useState<PlaytestAnalyticsCompareRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadCompare() {
    if (!levelIds.length) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/playtest-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelIds }),
      }).then((r) => r.json());
      if (res.success) setRows(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 随批量结果或选中关卡刷新
  }, [triggerKey, levelIds.join(",")]);

  const mismatchCount = rows.filter((r) => r.mismatchLevel === "high" || r.mismatchLevel === "medium").length;

  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm">Playtest vs 真实数据对比</CardTitle>
          <p className="text-xs text-muted-foreground">
            {rows.length > 0 ? `${mismatchCount} 关存在明显偏差` : "对比模拟通关率与玩家真实通关率"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadCompare()} disabled={loading || !levelIds.length}>
          刷新对比
        </Button>
      </CardHeader>
      <CardContent>
        {!levelIds.length ? (
          <p className="text-sm text-muted-foreground">请选择关卡或完成批量模拟后查看对比。</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="px-2 py-2 text-left">关卡</th>
                  <th className="px-2 py-2 text-left">Playtest</th>
                  <th className="px-2 py-2 text-left">真实</th>
                  <th className="px-2 py-2 text-left">差值</th>
                  <th className="px-2 py-2 text-left">偏差</th>
                  <th className="px-2 py-2 text-left">说明</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.levelId}
                    className={`border-b ${r.mismatchLevel === "high" ? "bg-red-50" : r.mismatchLevel === "medium" ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-2 py-2">
                      {r.levelIndex ?? "-"} · {r.levelName}
                    </td>
                    <td className="px-2 py-2">
                      {r.playtestPassRate != null ? `${Math.round(r.playtestPassRate * 100)}%` : "-"}
                    </td>
                    <td className="px-2 py-2">
                      {r.actualPassRate != null ? `${Math.round(r.actualPassRate * 100)}%` : "-"}
                    </td>
                    <td className="px-2 py-2">
                      {r.delta != null ? `${Math.round(r.delta * 100)}%` : "-"}
                    </td>
                    <td className="px-2 py-2">
                      <Badge
                        variant={r.mismatchLevel === "high" ? "destructive" : r.mismatchLevel === "medium" ? "default" : "outline"}
                      >
                        {MISMATCH_LABEL[r.mismatchLevel]}
                      </Badge>
                    </td>
                    <td className="max-w-xs px-2 py-2 text-muted-foreground">{r.message}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-muted-foreground">
                      无对比数据（需同时有 Playtest 结果与导入的玩家数据）
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
