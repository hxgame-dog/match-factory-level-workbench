"use client";

import { useEffect, useMemo, useState } from "react";

import { WorkspaceFilterBanner } from "@/components/shell/WorkspaceFilterBanner";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { AutoGenerateLevelsResult, SourceLevelPatternAnalysis } from "@/types/autoLevel";

import { Button } from "@/components/ui/button";
import { AutoLevelConfigForm } from "./AutoLevelConfigForm";
import { AutoLevelJsonPreviewDialog } from "./AutoLevelJsonPreviewDialog";
import { AutoLevelResultPanel } from "./AutoLevelResultPanel";
import { AutoRunHistory } from "./AutoRunHistory";
import { FormulaPresetSelector } from "./FormulaPresetSelector";
import { GenerationConstraintsPanel } from "./GenerationConstraintsPanel";
import { SourceAnalysisPanel } from "./SourceAnalysisPanel";
import { SourceLevelSelector } from "./SourceLevelSelector";
import { TargetCurveChart } from "./TargetCurveChart";

export function AutoLevelGeneratorPage({
  levels,
  presets,
  initialRuns,
}: {
  levels: Array<{ id: string; name: string; levelIndex: number; status: string; itemSetId: string }>;
  presets: Array<{ id: string; name: string; isDefault: boolean }>;
  initialRuns: Array<{ id: string; name: string; status: string; generateCount: number; createdAt: string }>;
}) {
  const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);
  const [formulaPresetId, setFormulaPresetId] = useState<string>("");
  const [form, setForm] = useState<Record<string, string | number>>({
    name: `Auto Run ${new Date().toLocaleString("zh-CN")}`,
    generateCount: 5,
    candidatesPerLevel: 3,
    growthRate: 0.08,
    minP: 0.4,
    maxP: 2,
  });
  const [noveltyRate, setNoveltyRate] = useState(0.2);
  const [analysis, setAnalysis] = useState<SourceLevelPatternAnalysis | null>(null);
  const [targetCurve, setTargetCurve] = useState<AutoGenerateLevelsResult["targetCurve"]>([]);
  const [result, setResult] = useState<AutoGenerateLevelsResult | null>(null);
  const [runs, setRuns] = useState(initialRuns);
  const [previewJson, setPreviewJson] = useState<unknown>(null);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeId);
  const visibleLevels = useMemo(() => {
    if (!activeWorkspaceId) return levels;
    return levels.filter((l) => l.itemSetId === activeWorkspaceId);
  }, [levels, activeWorkspaceId]);

  useEffect(() => {
    setSelectedLevelIds((prev) => prev.filter((id) => visibleLevels.some((l) => l.id === id)));
  }, [visibleLevels]);

  const sourceLine = useMemo(() => {
    if (!analysis?.difficulty || selectedLevelIds.length === 0) return [];
    const picked = visibleLevels.filter((l) => selectedLevelIds.includes(l.id)).sort((a, b) => a.levelIndex - b.levelIndex);
    const min = analysis.difficulty.minP ?? 0;
    const max = analysis.difficulty.maxP ?? 1;
    return picked.map((x, idx) => ({ levelIndex: x.levelIndex, P: min + (max - min) * (idx / Math.max(1, picked.length - 1)) }));
  }, [analysis, visibleLevels, selectedLevelIds]);

  async function analyze() {
    const res = await fetch("/api/auto-level-generator/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceLevelIds: selectedLevelIds, formulaPresetId: formulaPresetId || undefined }),
    }).then((r) => r.json());
    if (res.success) setAnalysis(res.data);
  }

  async function calcCurve() {
    const res = await fetch("/api/auto-level-generator/target-curve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceLevelIds: selectedLevelIds,
        formulaPresetId: formulaPresetId || undefined,
        generateCount: Number(form.generateCount),
        curveConfig: {
          curveType: "smooth_growth",
          growthRate: Number(form.growthRate),
          minP: Number(form.minP),
          maxP: Number(form.maxP),
        },
      }),
    }).then((r) => r.json());
    if (res.success) setTargetCurve(res.data);
  }

  async function generate() {
    const res = await fetch("/api/auto-level-generator/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.name),
        sourceLevelIds: selectedLevelIds,
        formulaPresetId: formulaPresetId || undefined,
        generateCount: Number(form.generateCount),
        candidatesPerLevel: Number(form.candidatesPerLevel),
        curveConfig: {
          curveType: "smooth_growth",
          growthRate: Number(form.growthRate),
          minP: Number(form.minP),
          maxP: Number(form.maxP),
        },
        generationConstraints: {
          sameThemeOnly: true,
          allowNewItemSet: false,
          maxNewItemsPerLevel: 0,
          reuseExistingAssets: true,
          noveltyRate,
        },
      }),
    }).then((r) => r.json());
    if (res.success) {
      setResult(res.data);
      setTargetCurve(res.data.targetCurve ?? []);
      const list = await fetch("/api/auto-level-generator/runs").then((r) => r.json());
      if (list.success)
        setRuns(
          list.data.map((x: { id: string; name: string; status: string; generateCount: number; createdAt: string }) => ({
            id: x.id,
            name: x.name,
            status: x.status,
            generateCount: x.generateCount,
            createdAt: x.createdAt,
          })),
        );
    }
  }

  const postNoBody = (url: string) => fetch(url, { method: "POST" });

  return (
    <div className="space-y-4">
      <WorkspaceFilterBanner totalCount={levels.length} filteredCount={visibleLevels.length} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SourceLevelSelector
          levels={visibleLevels}
          selectedIds={selectedLevelIds}
          onToggle={(id) => setSelectedLevelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
          onQuickPick={(count) =>
            setSelectedLevelIds(
              [...visibleLevels].sort((a, b) => b.levelIndex - a.levelIndex).slice(0, count).map((x) => x.id),
            )
          }
        />
        <FormulaPresetSelector presets={presets} value={formulaPresetId} onChange={setFormulaPresetId} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AutoLevelConfigForm form={form} onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))} />
        <GenerationConstraintsPanel noveltyRate={noveltyRate} onNoveltyRateChange={setNoveltyRate} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={analyze}>
          分析参考关卡
        </Button>
        <Button variant="outline" onClick={calcCurve}>
          生成目标曲线
        </Button>
        <Button onClick={generate}>批量生成关卡</Button>
        {result?.runId ? (
          <>
            <Button variant="outline" onClick={() => postNoBody(`/api/auto-level-generator/runs/${result.runId}/save-selected`)}>Save Selected Candidates</Button>
            <Button variant="outline" onClick={() => postNoBody(`/api/auto-level-generator/runs/${result.runId}/save-best`)}>Save Best Candidates</Button>
            <Button variant="outline" onClick={() => postNoBody(`/api/auto-level-generator/runs/${result.runId}/export-json-zip`)}>Export Selected JSON ZIP</Button>
          </>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SourceAnalysisPanel analysis={analysis} />
        <TargetCurveChart source={sourceLine} target={targetCurve} />
      </div>
      <AutoLevelResultPanel
        result={result}
        onPreviewCandidate={(c) => setPreviewJson(c.level)}
        onSelectCandidate={(id) => postNoBody(`/api/auto-level-generator/candidates/${id}/select`)}
        onRejectCandidate={(id) => postNoBody(`/api/auto-level-generator/candidates/${id}/reject`)}
        onSaveCandidate={(id) => postNoBody(`/api/auto-level-generator/candidates/${id}/save-as-level`)}
      />
      <AutoRunHistory
        runs={runs}
        onOpen={async (id) => {
          const res = await fetch(`/api/auto-level-generator/runs/${id}`).then((r) => r.json());
          if (res.success && res.data?.resultJson) setResult(JSON.parse(res.data.resultJson));
        }}
        onDelete={async (id) => {
          const res = await fetch(`/api/auto-level-generator/runs/${id}`, { method: "DELETE" }).then((r) => r.json());
          if (res.success) setRuns((prev) => prev.filter((x) => x.id !== id));
        }}
      />
      <AutoLevelJsonPreviewDialog open={Boolean(previewJson)} json={previewJson} onClose={() => setPreviewJson(null)} />
    </div>
  );
}
