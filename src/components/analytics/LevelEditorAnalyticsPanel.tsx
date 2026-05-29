"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LevelFeedbackDiagnosisResult } from "@/types/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ISSUE_TAG_LABEL: Record<string, string> = {
  too_easy_real: "真实偏易",
  too_hard_real: "真实偏难",
  formula_underestimates: "公式低估难度",
  formula_overestimates: "公式高估难度",
  playtest_underestimates: "模拟低估难度",
  playtest_overestimates: "模拟高估难度",
  low_data_confidence: "样本量不足",
  high_quit_rate: "退出率偏高",
  high_retry_rate: "重试率偏高",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "严重",
};

type SummaryResponse = {
  hasAnalytics: boolean;
  analyticsBatchId?: string;
  analyticsBatchName?: string;
  latestDiagnosisId?: string;
  diagnosis?: LevelFeedbackDiagnosisResult;
};

export function LevelEditorAnalyticsPanel({
  levelId,
  levelName,
}: {
  levelId: string;
  levelName?: string;
}) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!levelId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/level-summary?levelId=${encodeURIComponent(levelId)}`).then((r) => r.json());
      if (!res.success) {
        setSummary({ hasAnalytics: false });
        setError(res.error ?? "加载失败");
        return;
      }
      setSummary(res.data);
    } finally {
      setLoading(false);
    }
  }, [levelId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  async function runDiagnosis() {
    setActionLoading(true);
    setError(null);
    setProposalId(null);
    try {
      const res = await fetch("/api/analytics/diagnose-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId, includePlaytest: true }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "诊断失败");
        return;
      }
      setSummary({
        hasAnalytics: true,
        latestDiagnosisId: res.data.diagnosisId,
        diagnosis: res.data.diagnosis,
        analyticsBatchId: summary?.analyticsBatchId,
        analyticsBatchName: summary?.analyticsBatchName,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function generateProposal() {
    const diagnosisId = summary?.latestDiagnosisId;
    if (!diagnosisId) {
      setError("请先运行反馈诊断");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/optimization/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId, diagnosisId, mode: "balanced" }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "生成优化提案失败");
        return;
      }
      setProposalId(res.data.proposalId);
    } finally {
      setActionLoading(false);
    }
  }

  const diagnosis = summary?.diagnosis;

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">玩家数据反馈</CardTitle>
        <p className="text-xs text-gray-500">
          {levelName ? `当前关卡：${levelName}` : "真实表现与公式/试玩对比"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? <p className="text-gray-500">加载中…</p> : null}

        {!loading && !summary?.hasAnalytics ? (
          <p className="text-gray-500">
            暂无该关卡的玩家数据。请先在
            <Link href="/analytics-feedback" className="mx-1 text-blue-600 hover:underline">
              玩家数据回灌
            </Link>
            导入 CSV/JSON。
          </p>
        ) : null}

        {diagnosis ? (
          <>
            <div className="grid gap-2 rounded-md border border-gray-200 p-3 text-xs md:grid-cols-3">
              <div>
                <p className="text-gray-500">真实通关率</p>
                <p className="text-lg font-semibold text-gray-900">
                  {diagnosis.analytics.passRate != null
                    ? `${Math.round(diagnosis.analytics.passRate * 100)}%`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Formula P</p>
                <p className="text-lg font-semibold text-gray-900">
                  {diagnosis.formula?.P?.toFixed(2) ?? "-"}
                  {diagnosis.formula?.label ? ` (${diagnosis.formula.label})` : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Playtest 通关率</p>
                <p className="text-lg font-semibold text-gray-900">
                  {diagnosis.playtest?.passRate != null
                    ? `${Math.round(diagnosis.playtest.passRate * 100)}%`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">严重度：{SEVERITY_LABEL[diagnosis.severity] ?? diagnosis.severity}</Badge>
              <Badge variant="outline">
                数据置信度：{diagnosis.dataQuality.confidence === "high" ? "高" : diagnosis.dataQuality.confidence === "medium" ? "中" : "低"}
              </Badge>
              {summary?.analyticsBatchName ? (
                <Badge variant="secondary">批次：{summary.analyticsBatchName}</Badge>
              ) : null}
            </div>

            {diagnosis.issueTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {diagnosis.issueTags.map((tag) => (
                  <Badge key={tag} variant="destructive" className="text-xs font-normal">
                    {ISSUE_TAG_LABEL[tag] ?? tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">未发现明显问题标签</p>
            )}

            {diagnosis.comparison.formulaVsAnalytics?.message ? (
              <p className="text-xs text-gray-600">公式对比：{diagnosis.comparison.formulaVsAnalytics.message}</p>
            ) : null}
            {diagnosis.comparison.playtestVsAnalytics?.message ? (
              <p className="text-xs text-gray-600">试玩对比：{diagnosis.comparison.playtestVsAnalytics.message}</p>
            ) : null}
          </>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>提示</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {proposalId ? (
          <Alert>
            <AlertTitle>优化提案已生成</AlertTitle>
            <AlertDescription>
              <Link href="/analytics-feedback" className="text-blue-600 hover:underline">
                前往 Analytics Feedback 查看与采纳 →
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void runDiagnosis()} disabled={!levelId || actionLoading}>
            运行反馈诊断
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void generateProposal()}
            disabled={!levelId || actionLoading || !summary?.hasAnalytics}
          >
            生成优化提案
          </Button>
          <Link
            href={`/analytics-feedback${levelId ? `?levelId=${encodeURIComponent(levelId)}` : ""}`}
            className="inline-flex h-8 items-center rounded-md border border-gray-200 px-3 text-xs text-gray-700 hover:bg-gray-50"
          >
            打开 Analytics 详情
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
