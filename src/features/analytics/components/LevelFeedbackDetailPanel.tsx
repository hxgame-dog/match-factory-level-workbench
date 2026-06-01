"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";

export function LevelFeedbackDetailPanel({ detail }: { detail: (LevelFeedbackDiagnosisResult & { matchedLevelId?: string }) | null }) {
  if (!detail) return null;
  return (
    <Card className="border border-border">
      <CardHeader><CardTitle className="text-sm">Level Detail · {detail.levelName ?? "未匹配"}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded border border-border p-2">
            <p className="font-medium">真实数据</p>
            <p>Pass: {fmtPct(detail.analytics.passRate)}</p>
            <p>Quit: {fmtPct(detail.analytics.quitRate)}</p>
            <p>Retry: {fmtPct(detail.analytics.retryRate)}</p>
            <p>置信度: {detail.dataQuality.confidence}</p>
          </div>
          <div className="rounded border border-border p-2">
            <p className="font-medium">Formula</p>
            <p>P: {detail.formula?.P?.toFixed(3) ?? "-"}</p>
            <p>Label: {detail.formula?.label ?? "-"}</p>
            <p className="mt-1 text-amber-600">{detail.comparison.formulaVsAnalytics?.message ?? ""}</p>
          </div>
          <div className="rounded border border-border p-2">
            <p className="font-medium">Playtest</p>
            <p>Pass: {fmtPct(detail.playtest?.passRate)}</p>
            <p>剩余: {detail.playtest?.avgRemainingTime?.toFixed(1) ?? "-"}</p>
            <p className="mt-1 text-amber-600">{detail.comparison.playtestVsAnalytics?.message ?? ""}</p>
          </div>
        </div>
        <p className="font-medium">Issue Tags：<span className="text-blue-600">{detail.issueTags.join(", ")}</span> · Severity: {detail.severity}</p>
        <div>
          <p className="font-medium">建议</p>
          <ul className="list-disc pl-4">
            {detail.suggestions.map((s, i) => (
              <li key={i}>[{s.priority}] {s.action} — {s.detail}（{s.expectedEffect}）</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function fmtPct(value?: number) {
  return value !== undefined ? `${Math.round(value * 100)}%` : "-";
}
