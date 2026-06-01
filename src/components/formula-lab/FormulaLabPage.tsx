"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  DifficultyAnomaly,
  DifficultyDiagnosisResult,
  DifficultyFormulaConfig,
  GeminiDifficultyAdviceResult,
} from "@/types/difficulty";
import { defaultFormulaConfig } from "@/lib/difficulty/defaultFormulaConfig";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AnomalyList } from "./AnomalyList";
import { BatchReplayPanel } from "./BatchReplayPanel";
import { DiagnosisRunHistory } from "./DiagnosisRunHistory";
import { DifficultyCurveChart } from "./DifficultyCurveChart";
import { DifficultyScoreCards } from "./DifficultyScoreCards";
import { DistributionCharts } from "./DistributionCharts";
import { FormulaPresetManager } from "./FormulaPresetManager";
import { FormulaWeightTabs } from "./FormulaWeightTabs";
import { GeminiAdvicePanel } from "./GeminiAdvicePanel";
import { SimilarityPairsTable } from "./SimilarityPairsTable";
import { SingleLevelDiagnosisPanel } from "./SingleLevelDiagnosisPanel";
import { FormulaCalibrationChart } from "./FormulaCalibrationChart";
import type { CalibrationPoint } from "@/lib/analytics/compareFormulaPlaytestAnalytics";
import { FormulaBatchReplayResultsCard } from "@/features/formula-lab/components/FormulaBatchReplayResultsCard";
import { FormulaPlaytestCompareTable } from "@/features/formula-lab/components/FormulaPlaytestCompareTable";
import type { PlaytestCompareRow } from "@/features/formula-lab/types";

type PresetRow = {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  updatedAt: string;
};

type LevelOption = { id: string; name: string; levelIndex?: number | null };

type DiagnosisRun = {
  id: string;
  levelName?: string | null;
  formulaName?: string | null;
  createdAt: string;
};

export function FormulaLabPage({
  levels,
  initialPresets,
  initialRuns,
  playtestCompare,
  mockMode,
  initialPresetId,
  initialPresetName,
  initialPresetDescription,
  initialFormulaConfig,
}: {
  levels: LevelOption[];
  initialPresets: PresetRow[];
  initialRuns: DiagnosisRun[];
  playtestCompare: PlaytestCompareRow[];
  mockMode: boolean;
  initialPresetId: string;
  initialPresetName: string;
  initialPresetDescription: string;
  initialFormulaConfig: DifficultyFormulaConfig;
}) {
  const [presets, setPresets] = useState(initialPresets);
  const [runs, setRuns] = useState(initialRuns);
  const [selectedPresetId, setSelectedPresetId] = useState(initialPresetId);
  const [presetName, setPresetName] = useState(initialPresetName);
  const [presetDescription, setPresetDescription] = useState(initialPresetDescription);
  const [formulaConfig, setFormulaConfig] = useState<DifficultyFormulaConfig>(initialFormulaConfig);

  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [singleDiagnosis, setSingleDiagnosis] = useState<DifficultyDiagnosisResult | null>(null);
  const [batchResults, setBatchResults] = useState<DifficultyDiagnosisResult[]>([]);
  const [batchAnomalies, setBatchAnomalies] = useState<DifficultyAnomaly[]>([]);
  const [batchSummary, setBatchSummary] = useState<{
    count: number;
    avgP: number;
    maxP: number;
    minP: number;
    labelDistribution: Record<string, number>;
  } | null>(null);
  const [recentCount, setRecentCount] = useState(10);
  const [advice, setAdvice] = useState<GeminiDifficultyAdviceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([]);
  const [calibrationSummary, setCalibrationSummary] = useState<{
    total: number;
    formulaMismatchCount: number;
    withActualPassRate: number;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/analytics/calibration")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCalibrationPoints(res.data.points);
          setCalibrationSummary(res.data.summary);
        }
      });
  }, []);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId),
    [presets, selectedPresetId],
  );

  const refreshPresets = useCallback(async () => {
    const res = await fetch("/api/formula-presets").then((r) => r.json());
    if (res.success) {
      setPresets(
        res.data.map((p: PresetRow & { description?: string | null }) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          isDefault: p.isDefault,
          updatedAt: new Date(p.updatedAt).toISOString(),
        })),
      );
    }
  }, []);

  const refreshRuns = useCallback(async () => {
    const res = await fetch("/api/difficulty/runs").then((r) => r.json());
    if (res.success) {
      setRuns(
        res.data.map((r: { id: string; levelName?: string | null; formulaName?: string | null; createdAt: string }) => ({
          id: r.id,
          levelName: r.levelName,
          formulaName: r.formulaName,
          createdAt: new Date(r.createdAt).toISOString(),
        })),
      );
    }
  }, []);

  const loadPresetConfig = useCallback(async (id: string) => {
    if (!id || id === "none") {
      setFormulaConfig(defaultFormulaConfig);
      setPresetName("");
      setPresetDescription("");
      return;
    }
    const res = await fetch(`/api/formula-presets/${id}`).then((r) => r.json());
    if (res.success) {
      setFormulaConfig(res.data.config as DifficultyFormulaConfig);
      setPresetName(res.data.name);
      setPresetDescription(res.data.description ?? "");
    } else {
      setError(res.error ?? "加载预设失败");
    }
  }, []);

  async function handleSelectPreset(id: string) {
    setSelectedPresetId(id);
    setError(null);
    await loadPresetConfig(id);
  }

  async function handleCreatePreset() {
    setError(null);
    const name = presetName.trim() || `Preset ${new Date().toLocaleString("zh-CN")}`;
    const res = await fetch("/api/formula-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: presetDescription, config: formulaConfig }),
    }).then((r) => r.json());
    if (!res.success) {
      setError(res.error ?? "创建失败");
      return;
    }
    await refreshPresets();
    setSelectedPresetId(res.data.id);
    setPresetName(res.data.name);
    setPresetDescription(res.data.description ?? "");
  }

  async function handleCopyPreset() {
    if (!selectedPresetId) {
      setError("请先选择要复制的预设");
      return;
    }
    const name = `${presetName || "Preset"} (副本)`;
    const res = await fetch("/api/formula-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: presetDescription, config: formulaConfig }),
    }).then((r) => r.json());
    if (!res.success) {
      setError(res.error ?? "复制失败");
      return;
    }
    await refreshPresets();
    setSelectedPresetId(res.data.id);
    setPresetName(res.data.name);
  }

  async function handleSavePreset() {
    if (!selectedPresetId) {
      setError("请先选择预设再保存");
      return;
    }
    const res = await fetch(`/api/formula-presets/${selectedPresetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: presetName || activePreset?.name || "未命名预设",
        description: presetDescription,
        config: formulaConfig,
      }),
    }).then((r) => r.json());
    if (!res.success) {
      setError(res.error ?? "保存失败");
      return;
    }
    await refreshPresets();
  }

  async function handleDeletePreset() {
    if (!selectedPresetId) return;
    const res = await fetch(`/api/formula-presets/${selectedPresetId}`, { method: "DELETE" }).then((r) =>
      r.json(),
    );
    if (!res.success) {
      setError(res.error ?? "删除失败");
      return;
    }
    await refreshPresets();
    const next = presets.find((p) => p.id !== selectedPresetId);
    if (next) {
      await handleSelectPreset(next.id);
    } else {
      setSelectedPresetId("");
      setFormulaConfig(defaultFormulaConfig);
      setPresetName("");
      setPresetDescription("");
    }
  }

  async function handleSetDefault() {
    if (!selectedPresetId) return;
    const res = await fetch(`/api/formula-presets/${selectedPresetId}/set-default`, { method: "POST" }).then((r) =>
      r.json(),
    );
    if (!res.success) {
      setError(res.error ?? "设置默认失败");
      return;
    }
    await refreshPresets();
  }

  function handleResetDefault() {
    setFormulaConfig(defaultFormulaConfig);
    setError(null);
  }

  async function handleDiagnose() {
    if (!selectedLevelId) {
      setError("请先选择关卡");
      return;
    }
    setLoading(true);
    setError(null);
    setAdvice(null);
    try {
      const res = await fetch("/api/difficulty/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: selectedLevelId,
          formulaPresetId: selectedPresetId || undefined,
          formulaConfig,
          saveRun: true,
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "诊断失败");
        return;
      }
      setSingleDiagnosis(res.data);
      await refreshRuns();
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchReplay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/difficulty/batch-replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentCount,
          formulaPresetId: selectedPresetId || undefined,
          formulaConfig,
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "批量回放失败");
        return;
      }
      setBatchResults(res.results ?? []);
      setBatchAnomalies(res.anomalies ?? []);
      setBatchSummary(res.summary ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAskGemini() {
    if (!singleDiagnosis) {
      setError("请先完成单关诊断");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/difficulty/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: selectedLevelId || undefined,
          diagnosis: singleDiagnosis,
        }),
      }).then((r) => r.json());
      if (!res.success) {
        setError(res.error ?? "获取 Gemini 建议失败");
        return;
      }
      setAdvice(res.data);
      await fetch("/api/difficulty/save-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: selectedLevelId,
          levelName: singleDiagnosis.levelName,
          formulaPresetId: selectedPresetId || undefined,
          formulaName: activePreset?.name,
          result: singleDiagnosis,
          aiAdvice: res.data,
        }),
      });
      await refreshRuns();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,320px)_1fr]">
        <div className="space-y-4">
      <FormulaPresetManager
        presets={presets}
        selectedId={selectedPresetId}
        name={presetName}
        description={presetDescription}
        onSelect={(id) => void handleSelectPreset(id === "none" ? "" : id)}
        onNameChange={setPresetName}
        onDescriptionChange={setPresetDescription}
        onCreate={() => void handleCreatePreset()}
        onCopy={() => void handleCopyPreset()}
        onSave={() => void handleSavePreset()}
        onDelete={() => void handleDeletePreset()}
        onSetDefault={() => void handleSetDefault()}
        onResetDefault={handleResetDefault}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">公式权重配置</CardTitle>
        </CardHeader>
        <CardContent>
          <FormulaWeightTabs config={formulaConfig} onChange={setFormulaConfig} />
        </CardContent>
      </Card>
        </div>

        <div className="space-y-4 min-w-0">
      <div className="grid gap-4 lg:grid-cols-2">
        <SingleLevelDiagnosisPanel
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectLevel={setSelectedLevelId}
          onDiagnose={() => void handleDiagnose()}
        />
        <BatchReplayPanel
          recentCount={recentCount}
          onRecentCountChange={setRecentCount}
          onReplay={() => void handleBatchReplay()}
        />
      </div>

      {loading ? <p className="text-sm text-muted-foreground">处理中…</p> : null}

      <DifficultyScoreCards diagnosis={singleDiagnosis} />

      {singleDiagnosis?.warnings?.length ? (
        <Alert>
          <AlertTitle>警告</AlertTitle>
          <AlertDescription>{singleDiagnosis.warnings.join("；")}</AlertDescription>
        </Alert>
      ) : null}

      {singleDiagnosis?.suggestions?.length ? (
        <Alert>
          <AlertTitle>本地建议</AlertTitle>
          <AlertDescription>{singleDiagnosis.suggestions.join("；")}</AlertDescription>
        </Alert>
      ) : null}

      <DistributionCharts diagnosis={singleDiagnosis} />
      <SimilarityPairsTable diagnosis={singleDiagnosis} />

      <GeminiAdvicePanel advice={advice} mockMode={mockMode} onAsk={() => void handleAskGemini()} />

      <FormulaBatchReplayResultsCard
        summary={batchSummary}
        results={batchResults}
        anomalies={batchAnomalies}
      />

      <FormulaCalibrationChart points={calibrationPoints} summary={calibrationSummary ?? undefined} />

      <DiagnosisRunHistory runs={runs} />

      <FormulaPlaytestCompareTable rows={playtestCompare} />
        </div>
      </div>
    </div>
  );
}
