"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnalyticsImportCenter } from "./AnalyticsImportCenter";
import { FieldMappingTable } from "./FieldMappingTable";
import { MockAnalyticsPanel } from "./MockAnalyticsPanel";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { FeedbackDiagnosisTable } from "./FeedbackDiagnosisTable";
import { LevelFeedbackDetailPanel } from "./LevelFeedbackDetailPanel";
import { AnalyticsGeminiAdvicePanel } from "./AnalyticsGeminiAdvicePanel";
import { OptimizationProposalPanel } from "./OptimizationProposalPanel";
import { AnalyticsHistoryPanel } from "./AnalyticsHistoryPanel";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/ui/notify";
import type {
  AnalyticsImportPreview,
  GeminiAnalyticsAdviceResult,
  LevelFeedbackDiagnosisResult,
  OptimizationProposalResult,
} from "@/types/analytics";

type DiagnosisRow = LevelFeedbackDiagnosisResult & { matched?: boolean; matchedLevelId?: string };

export function AnalyticsFeedbackPage({
  batches: initialBatches,
}: {
  batches: Array<{ id: string; name: string; source?: string | null; status: string; rowCount: number; createdAt: string }>;
}) {
  const [batchName, setBatchName] = useState("player_metrics");
  const [source, setSource] = useState("custom_csv");
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState<"csv" | "json" | "excel">("csv");
  const [preview, setPreview] = useState<AnalyticsImportPreview | null>(null);
  const [batches, setBatches] = useState(initialBatches);
  const [activeBatchId, setActiveBatchId] = useState<string>("");
  const [diagnoses, setDiagnoses] = useState<DiagnosisRow[]>([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [detail, setDetail] = useState<DiagnosisRow | null>(null);
  const [advice, setAdvice] = useState<GeminiAnalyticsAdviceResult | null>(null);
  const [optMode, setOptMode] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [proposal, setProposal] = useState<OptimizationProposalResult | null>(null);
  const [optimizedFormula, setOptimizedFormula] = useState<{ P: number; label: string } | null>(null);
  const [proposalId, setProposalId] = useState<string>("");
  const [diagnosisIdByLevel, setDiagnosisIdByLevel] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function refreshBatches() {
    const res = await fetch("/api/analytics/batches").then((r) => r.json());
    if (res.success) {
      setBatches(
        res.data.map((b: { id: string; name: string; source?: string | null; status: string; rows: unknown[]; createdAt: string }) => ({
          id: b.id,
          name: b.name,
          source: b.source,
          status: b.status,
          rowCount: b.rows.length,
          createdAt: b.createdAt,
        })),
      );
    }
  }

  async function dryRun() {
    setError(null);
    const res = await fetch("/api/analytics/import/dry-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchName, source, fileContent: content, fileType }),
    }).then((r) => r.json());
    if (res.success) {
      setPreview(res.data);
      notify.success("导入预览完成", `有效行 ${res.data.summary?.validRows ?? res.data.rows?.length ?? 0}`);
    } else {
      setError(res.error);
      notify.error("导入预览失败", res.error);
    }
  }

  async function confirmImport() {
    setError(null);
    const res = await fetch("/api/analytics/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchName, source, fileContent: content, fileType }),
    }).then((r) => r.json());
    if (res.success) {
      setActiveBatchId(res.data.batchId);
      await refreshBatches();
      notify.success("数据批次已导入");
    } else {
      setError(res.error);
      notify.error("导入失败", res.error);
    }
  }

  async function generateMock(mode: "mixed" | "hard" | "easy") {
    setError(null);
    const res = await fetch("/api/analytics/mock-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchName: `${batchName}_mock_${mode}`, mode }),
    }).then((r) => r.json());
    if (res.success) {
      setActiveBatchId(res.data.batchId);
      await refreshBatches();
      notify.success("模拟数据已生成", mode);
    } else {
      setError(res.error);
      notify.error("模拟数据生成失败", res.error);
    }
  }

  async function diagnoseBatch() {
    if (!activeBatchId) {
      const msg = "请先导入或选择一个数据批次";
      setError(msg);
      notify.warning(msg);
      return;
    }
    const toastId = notify.loading("正在诊断玩家反馈…");
    const res = await fetch("/api/analytics/diagnose-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: activeBatchId, includePlaytest: true, saveResults: true, writeBackToLevels: true }),
    }).then((r) => r.json());
    notify.dismiss(toastId);
    if (res.success) {
      setDiagnoses(res.data.results);
      setUnmatchedCount(res.data.unmatchedCount);
      notify.success("反馈诊断完成", `共 ${res.data.results.length} 关 · 未匹配 ${res.data.unmatchedCount}`);
      const list = await fetch("/api/analytics/diagnoses").then((r) => r.json());
      if (list.success) {
        const map: Record<string, string> = {};
        for (const d of list.data) {
          if (d.levelId && !map[d.levelId]) map[d.levelId] = d.id;
        }
        setDiagnosisIdByLevel(map);
      }
    } else {
      setError(res.error);
      notify.error("诊断失败", res.error);
    }
  }

  async function askAdvice() {
    if (!detail) return;
    const toastId = notify.loading("正在生成 AI 分析建议…");
    const res = await fetch("/api/ai/analytics/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analytics: detail.analytics, feedbackDiagnosis: detail }),
    }).then((r) => r.json());
    notify.dismiss(toastId);
    if (res.success) {
      setAdvice(res.data);
      notify.success("AI 分析建议已生成");
    } else {
      setError(res.error);
      notify.error("获取建议失败", res.error);
    }
  }

  async function generateProposal() {
    if (!detail?.matchedLevelId) {
      const msg = "请选择一个已匹配关卡的诊断";
      setError(msg);
      notify.warning(msg);
      return;
    }
    const diagnosisId = diagnosisIdByLevel[detail.matchedLevelId];
    if (!diagnosisId) {
      const msg = "未找到诊断记录，请先运行诊断";
      setError(msg);
      notify.warning(msg);
      return;
    }
    const toastId = notify.loading("正在生成优化方案…");
    const res = await fetch("/api/analytics/optimization/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levelId: detail.matchedLevelId, diagnosisId, mode: optMode }),
    }).then((r) => r.json());
    notify.dismiss(toastId);
    if (res.success) {
      setProposal(res.data.proposal);
      setOptimizedFormula(res.data.optimizedFormula);
      setProposalId(res.data.proposalId);
      notify.success("优化方案已生成");
    } else {
      setError(res.error);
      notify.error("生成优化方案失败", res.error);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsImportCenter
          batchName={batchName}
          source={source}
          content={content}
          fileType={fileType}
          onBatchNameChange={setBatchName}
          onSourceChange={setSource}
          onContentChange={setContent}
          onFileTypeChange={setFileType}
          onDryRun={dryRun}
          onConfirm={confirmImport}
        />
        <div className="space-y-4">
          <MockAnalyticsPanel onGenerate={generateMock} />
          <FieldMappingTable preview={preview} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select value={activeBatchId} onChange={(e) => setActiveBatchId(e.target.value)} className="h-9 rounded-md border border-border px-2 text-sm">
          <option value="">选择数据批次</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}（{b.rowCount} 行）</option>
          ))}
        </select>
        <Button onClick={diagnoseBatch}>Run Feedback Diagnosis</Button>
      </div>

      <AnalyticsOverview diagnoses={diagnoses} unmatchedCount={unmatchedCount} />
      <AnalyticsCharts diagnoses={diagnoses} />
      <FeedbackDiagnosisTable
        rows={diagnoses}
        onSelect={(row) => {
          setDetail(row);
          setAdvice(null);
          setProposal(null);
        }}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <LevelFeedbackDetailPanel detail={detail} />
        <AnalyticsGeminiAdvicePanel advice={advice} onAsk={askAdvice} />
      </div>
      <OptimizationProposalPanel
        mode={optMode}
        onModeChange={setOptMode}
        onGenerate={generateProposal}
        proposal={proposal}
        optimizedFormula={optimizedFormula}
        onSaveAsLevel={async () => {
          if (!proposalId) return;
          const res = await fetch(`/api/analytics/optimization/${proposalId}/save-as-level`, { method: "POST" }).then((r) => r.json());
          if (res.success) notify.success("已保存为新关卡");
          else {
            setError(res.error);
            notify.error("保存关卡失败", res.error);
          }
        }}
        onReject={async () => {
          if (!proposalId) return;
          await fetch(`/api/analytics/optimization/${proposalId}/reject`, { method: "POST" });
          setProposal(null);
          notify.info("已拒绝该优化方案");
        }}
      />
      <AnalyticsHistoryPanel
        batches={batches}
        onOpen={(id) => setActiveBatchId(id)}
        onExport={async (id) => {
          const res = await fetch("/api/analytics/export-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchId: id }),
          }).then((r) => r.json());
          if (res.success) {
            window.open(res.data.excelUrl, "_blank");
            notify.success("分析报告已导出");
          } else {
            setError(res.error);
            notify.error("导出失败", res.error);
          }
        }}
        onDelete={async (id) => {
          const res = await fetch(`/api/analytics/batches/${id}`, { method: "DELETE" }).then((r) => r.json());
          if (res.success) {
            setBatches((prev) => prev.filter((b) => b.id !== id));
            if (activeBatchId === id) setActiveBatchId("");
            notify.success("数据批次已删除");
          } else notify.error("删除失败", res.error);
        }}
      />
    </div>
  );
}
