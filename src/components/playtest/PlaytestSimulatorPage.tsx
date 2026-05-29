"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GeminiPlaytestAdviceResult,
  PlaytestLevelSimulationResult,
  PlaytestSimulationResult,
  SimulatorConfig,
} from "@/types/playtest";
import { defaultSimulatorConfig } from "@/lib/playtest/defaultSimulatorConfig";
import { loadSimulatorConfigFromStorage } from "@/lib/playtest/simulatorConfigStorage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlaytestLevelSelector } from "./PlaytestLevelSelector";
import { SimulatorConfigPanel } from "./SimulatorConfigPanel";
import { SingleLevelSimulationPanel } from "./SingleLevelSimulationPanel";
import { BatchSimulationPanel, type BatchProgress } from "./BatchSimulationPanel";
import { PlaytestMetricCards } from "./PlaytestMetricCards";
import { ProfileBreakdownChart } from "./ProfileBreakdownChart";
import { FailReasonChart } from "./FailReasonChart";
import { QaIssueList, type QaIssueRow } from "./QaIssueList";
import { PlaytestGeminiAdvicePanel } from "./PlaytestGeminiAdvicePanel";
import { PlaytestRunHistory } from "./PlaytestRunHistory";
import { BatchResultsPanel } from "./BatchResultsPanel";
import { PlaytestSampleHistograms } from "./PlaytestSampleHistograms";
import { PlaytestAnalyticsComparePanel } from "./PlaytestAnalyticsComparePanel";

function buildBatchSummary(results: PlaytestLevelSimulationResult[], simulationCountPerLevel: number) {
  const avg = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
  return {
    levelCount: results.length,
    simulationCountPerLevel,
    avgPassRate: avg(results.map((r) => r.metrics.passRate)),
    avgCompletionTime: avg(results.map((r) => r.metrics.avgCompletionTime)),
    avgRemainingTime: avg(results.map((r) => r.metrics.avgRemainingTime)),
    totalIssueCount: results.reduce((s, r) => s + r.qaIssues.length, 0),
    needsReviewCount: results.filter((r) => r.status === "needs_review").length,
  };
}

export function PlaytestSimulatorPage({
  levels,
  runs: initialRuns,
  mockMode,
}: {
  levels: Array<{ id: string; name: string; levelIndex?: number | null }>;
  runs: Array<{ id: string; name: string; status: string; summaryJson?: string | null; createdAt: string }>;
  mockMode: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<SimulatorConfig>(defaultSimulatorConfig);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [includeSamples, setIncludeSamples] = useState(true);
  const [singleResult, setSingleResult] = useState<PlaytestLevelSimulationResult | null>(null);
  const [batchResult, setBatchResult] = useState<PlaytestSimulationResult | null>(null);
  const [advice, setAdvice] = useState<GeminiPlaytestAdviceResult | null>(null);
  const [runs, setRuns] = useState(initialRuns);
  const [error, setError] = useState<string | null>(null);
  const [singleRunning, setSingleRunning] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [persisting, setPersisting] = useState(false);
  const batchAbortRef = useRef(false);

  useEffect(() => {
    const saved = loadSimulatorConfigFromStorage();
    if (saved) {
      // 从 localStorage 恢复用户保存的模拟器配置
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 仅客户端挂载时读取 localStorage
      setConfig(saved);
    }
    setStorageLoaded(true);
  }, []);

  const selectedLevel = useMemo(() => levels.find((l) => l.id === selectedIds[0]), [levels, selectedIds]);

  const compareLevelIds = useMemo(() => {
    if (batchResult?.results?.length) return batchResult.results.map((r) => r.levelId);
    if (singleResult) return [singleResult.levelId];
    return selectedIds;
  }, [batchResult, singleResult, selectedIds]);

  const compareTriggerKey = useMemo(
    () =>
      batchResult?.runId ??
      (singleResult ? `${singleResult.levelId}-${singleResult.metrics.passRate}` : selectedIds.join(",")),
    [batchResult, singleResult, selectedIds],
  );

  const qaIssues = useMemo((): QaIssueRow[] => {
    const rows: QaIssueRow[] = [];
    if (singleResult?.qaIssues.length) {
      for (const issue of singleResult.qaIssues) {
        rows.push({
          ...issue,
          levelId: singleResult.levelId,
          levelName: singleResult.levelName,
          levelIndex: singleResult.levelIndex,
        });
      }
    }
    if (batchResult?.results.length) {
      for (const r of batchResult.results) {
        for (const issue of r.qaIssues) {
          rows.push({
            ...issue,
            levelId: r.levelId,
            levelName: r.levelName,
            levelIndex: r.levelIndex,
          });
        }
      }
    }
    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = `${row.levelId ?? ""}-${row.code}-${row.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [singleResult, batchResult]);

  const refreshRuns = useCallback(async () => {
    const list = await fetch("/api/playtest/runs").then((r) => r.json());
    if (list.success) setRuns(list.data);
  }, []);

  async function handleSingleRun() {
    if (!selectedLevel) return;
    setSingleRunning(true);
    setError(null);
    setAdvice(null);
    try {
      const res = await fetch("/api/playtest/simulate-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: selectedLevel.id,
          config,
          includeRawSamples: includeSamples,
          saveRun: true,
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "单关模拟失败");
        return;
      }
      setSingleResult(res.data.result);
      await refreshRuns();
    } finally {
      setSingleRunning(false);
    }
  }

  async function handleBatchRun() {
    if (!selectedIds.length) return;
    batchAbortRef.current = false;
    setBatchRunning(true);
    setPersisting(false);
    setError(null);
    setBatchProgress({ current: 0, total: selectedIds.length });

    const ordered = selectedIds
      .map((id) => levels.find((l) => l.id === id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l));

    const results: PlaytestLevelSimulationResult[] = [];

    try {
      for (let i = 0; i < ordered.length; i++) {
        if (batchAbortRef.current) {
          setError("批量模拟已取消");
          break;
        }
        const level = ordered[i];
        setBatchProgress({ current: i, total: ordered.length, currentLevelName: level.name });
        const res = await fetch("/api/playtest/simulate-level", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            levelId: level.id,
            config,
            includeRawSamples: false,
            saveRun: false,
          }),
        }).then((r) => r.json());
        if (!res.success) {
          setError(res.error ?? `关卡 ${level.name} 模拟失败`);
          break;
        }
        results.push(res.data.result);
        setBatchProgress({ current: i + 1, total: ordered.length, currentLevelName: level.name });
      }

      if (results.length > 0 && !batchAbortRef.current) {
        const summary = buildBatchSummary(results, config.simulationCount);
        setBatchResult({ summary, results });

        setPersisting(true);
        const persistRes = await fetch("/api/playtest/runs/persist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runName: `批量模拟 ${new Date().toLocaleString("zh-CN")}`,
            levelIds: selectedIds,
            config,
            results,
            writeBackToLevels: true,
          }),
        }).then((r) => r.json());
        if (persistRes.success) {
          setBatchResult(persistRes.data);
          await refreshRuns();
        } else {
          setError(persistRes.error ?? "保存批量记录失败（模拟结果已展示）");
        }
      }
    } finally {
      setBatchRunning(false);
      setPersisting(false);
      setBatchProgress(null);
    }
  }

  function handleBatchCancel() {
    batchAbortRef.current = true;
  }

  function handleSelectBatchLevel(result: PlaytestLevelSimulationResult) {
    setSingleResult(result);
    setSelectedIds([result.levelId]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!storageLoaded) {
    return <p className="text-sm text-gray-500">加载配置中…</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <PlaytestLevelSelector
          levels={levels}
          selectedIds={selectedIds}
          onToggle={(id) =>
            setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
          onQuick={(count) =>
            setSelectedIds(
              [...levels].sort((a, b) => (b.levelIndex ?? 0) - (a.levelIndex ?? 0)).slice(0, count).map((x) => x.id),
            )
          }
          onClear={() => setSelectedIds([])}
        />
        <SimulatorConfigPanel
          config={config}
          onChange={setConfig}
          onResetDefault={() => setConfig(defaultSimulatorConfig)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SingleLevelSimulationPanel
          levelName={selectedLevel?.name}
          running={singleRunning}
          includeSamples={includeSamples}
          onIncludeSamplesChange={setIncludeSamples}
          onRun={() => void handleSingleRun()}
        />
        <BatchSimulationPanel
          selectedCount={selectedIds.length}
          running={batchRunning || persisting}
          progress={batchProgress}
          onRun={() => void handleBatchRun()}
          onCancel={batchRunning ? handleBatchCancel : undefined}
        />
      </div>

      {persisting ? <p className="text-xs text-gray-500">正在保存批量任务记录…</p> : null}

      <PlaytestMetricCards metrics={singleResult?.metrics ?? null} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ProfileBreakdownChart
          rows={(singleResult?.profileBreakdown ?? []).map((x) => ({
            profileName: x.profileName,
            passRate: x.passRate,
          }))}
        />
        <FailReasonChart
          rows={(singleResult?.failReasons ?? []).map((x) => ({
            reason: x.reason,
            ratio: x.ratio,
          }))}
        />
      </div>

      <PlaytestSampleHistograms samples={singleResult?.rawSamples} />

      <div className="grid gap-4 xl:grid-cols-2">
        <QaIssueList issues={qaIssues} />
        <PlaytestGeminiAdvicePanel
          advice={advice}
          mockMode={mockMode}
          onAsk={async () => {
            if (!singleResult) {
              setError("请先完成单关模拟");
              return;
            }
            const res = await fetch("/api/ai/playtest/advice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ levelId: singleResult.levelId, playtestResult: singleResult }),
            }).then((r) => r.json());
            if (res.success) setAdvice(res.data);
            else setError(res.error ?? "获取建议失败");
          }}
        />
      </div>

      <BatchResultsPanel batchResult={batchResult} onSelectLevel={handleSelectBatchLevel} />

      <PlaytestAnalyticsComparePanel levelIds={compareLevelIds} triggerKey={compareTriggerKey} />

      <PlaytestRunHistory
        runs={runs}
        onOpen={async (id) => {
          const res = await fetch(`/api/playtest/runs/${id}`).then((r) => r.json());
          if (res.success) {
            const parsed = res.data.resultJson ? JSON.parse(res.data.resultJson) : null;
            setBatchResult(parsed);
            setSingleResult(null);
          }
        }}
        onExport={async (id) => {
          const res = await fetch(`/api/playtest/runs/${id}/export-report`, { method: "POST" }).then((r) => r.json());
          if (res.success) window.open(res.data.excelUrl, "_blank");
        }}
        onDelete={async (id) => {
          const res = await fetch(`/api/playtest/runs/${id}`, { method: "DELETE" }).then((r) => r.json());
          if (res.success) setRuns((prev) => prev.filter((x) => x.id !== id));
        }}
      />
    </div>
  );
}
