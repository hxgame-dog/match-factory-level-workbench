"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type QaIssueRow = {
  code: string;
  severity: string;
  title: string;
  detail: string;
  levelId?: string;
  levelName?: string;
  levelIndex?: number | null;
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const SEVERITY_LABEL: Record<string, string> = {
  all: "全部严重度",
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
};

export function QaIssueList({ issues }: { issues: QaIssueRow[] }) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [codeFilter, setCodeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");

  const codeOptions = useMemo(() => {
    const codes = new Set(issues.map((i) => i.code));
    return Array.from(codes).sort();
  }, [issues]);

  const levelOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues) {
      if (i.levelId) map.set(i.levelId, `${i.levelIndex ?? "-"} · ${i.levelName ?? i.levelId}`);
    }
    return Array.from(map.entries());
  }, [issues]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues
      .filter((issue) => {
        if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
        if (codeFilter !== "all" && issue.code !== codeFilter) return false;
        if (levelFilter !== "all" && issue.levelId !== levelFilter) return false;
        if (q && !`${issue.title} ${issue.detail} ${issue.code}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
  }, [issues, severityFilter, codeFilter, levelFilter, search]);

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-sm">QA 问题</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">无 QA 问题</p>
        ) : (
          <>
            <div className="grid gap-2 md:grid-cols-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索标题/详情/代码" />
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? "all")}>
                <SelectTrigger><SelectValue placeholder="严重度" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={codeFilter} onValueChange={(v) => setCodeFilter(v ?? "all")}>
                <SelectTrigger><SelectValue placeholder="问题代码" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部代码</SelectItem>
                  {codeOptions.map((code) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {levelOptions.length > 0 ? (
                <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v ?? "all")}>
                  <SelectTrigger><SelectValue placeholder="关卡" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部关卡</SelectItem>
                    {levelOptions.map(([id, label]) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">显示 {filtered.length} / {issues.length} 条</p>
            <div className="max-h-72 space-y-2 overflow-auto text-xs">
              {filtered.map((issue, idx) => (
                <div key={`${issue.code}_${issue.levelId ?? ""}_${idx}`} className="rounded border border-border p-2">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{issue.title}</span>
                    <Badge variant="outline">{SEVERITY_LABEL[issue.severity] ?? issue.severity}</Badge>
                    <span className="text-muted-foreground">{issue.code}</span>
                  </div>
                  {issue.levelName ? (
                    <p className="text-muted-foreground">关卡：{issue.levelIndex ?? "-"} · {issue.levelName}</p>
                  ) : null}
                  <p>{issue.detail}</p>
                </div>
              ))}
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground">无符合筛选条件的问题</p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
