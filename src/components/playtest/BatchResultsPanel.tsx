"use client";

import { useMemo, useState } from "react";
import type { PlaytestLevelSimulationResult, PlaytestSimulationResult } from "@/types/playtest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_LABEL: Record<string, string> = {
  completed: "已完成",
  needs_review: "待复核",
  failed: "失败",
  invalid_level: "无效关卡",
  all: "全部",
};

export function BatchResultsPanel({
  batchResult,
  onSelectLevel,
}: {
  batchResult: PlaytestSimulationResult | null;
  onSelectLevel?: (result: PlaytestLevelSimulationResult) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minPassRate, setMinPassRate] = useState("");
  const [maxPassRate, setMaxPassRate] = useState("");

  const filtered = useMemo(() => {
    const rows = batchResult?.results ?? [];
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (q && !`${r.levelIndex ?? ""} ${r.levelName}`.toLowerCase().includes(q)) return false;
      const min = minPassRate === "" ? null : Number(minPassRate) / 100;
      const max = maxPassRate === "" ? null : Number(maxPassRate) / 100;
      if (min != null && !Number.isNaN(min) && r.metrics.passRate < min) return false;
      if (max != null && !Number.isNaN(max) && r.metrics.passRate > max) return false;
      return true;
    });
  }, [batchResult, search, statusFilter, minPassRate, maxPassRate]);

  if (!batchResult?.results?.length) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm">批量模拟结果</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">暂无批量结果，请选择关卡后运行批量模拟。</p>
        </CardContent>
      </Card>
    );
  }

  const { summary } = batchResult;

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-sm">批量模拟结果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 text-xs text-gray-600 sm:grid-cols-3 lg:grid-cols-6">
          <p>关卡数：{summary.levelCount}</p>
          <p>每关样本：{summary.simulationCountPerLevel}</p>
          <p>平均通关率：{Math.round(summary.avgPassRate * 100)}%</p>
          <p>平均剩余时间：{summary.avgRemainingTime.toFixed(1)}s</p>
          <p>QA 问题总数：{summary.totalIssueCount}</p>
          <p>待复核：{summary.needsReviewCount}</p>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索关卡名/序号" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger><SelectValue placeholder="状态筛选" /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            max={100}
            value={minPassRate}
            onChange={(e) => setMinPassRate(e.target.value)}
            placeholder="最低通关率 %"
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={maxPassRate}
            onChange={(e) => setMaxPassRate(e.target.value)}
            placeholder="最高通关率 %"
          />
        </div>

        <p className="text-xs text-gray-500">
          显示 {filtered.length} / {batchResult.results.length} 关
        </p>

        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-2 py-2 text-left">关卡</th>
                <th className="px-2 py-2 text-left">通关率</th>
                <th className="px-2 py-2 text-left">剩余时间</th>
                <th className="px-2 py-2 text-left">槽位压力</th>
                <th className="px-2 py-2 text-left">QA</th>
                <th className="px-2 py-2 text-left">状态</th>
                <th className="px-2 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.levelId} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2">{r.levelIndex ?? "-"} · {r.levelName}</td>
                  <td className="px-2 py-2">{(r.metrics.passRate * 100).toFixed(1)}%</td>
                  <td className="px-2 py-2">{r.metrics.avgRemainingTime.toFixed(1)}s</td>
                  <td className="px-2 py-2">{r.metrics.avgSlotPressure.toFixed(2)}</td>
                  <td className="px-2 py-2">{r.qaIssues.length}</td>
                  <td className="px-2 py-2">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="px-2 py-2">
                    {onSelectLevel ? (
                      <button type="button" className="text-blue-600 hover:underline" onClick={() => onSelectLevel(r)}>
                        查看单关
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-6 text-center text-gray-500">
                    无符合筛选条件的关卡
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
