"use client";

import type {
  DifficultyAnomaly,
  DifficultyDiagnosisResult,
  GeminiDifficultyAdviceResult,
} from "@/types/difficulty";
import type { CalibrationPoint } from "@/lib/analytics/compareFormulaPlaytestAnalytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { BatchReplayPanel } from "./BatchReplayPanel";
import { DiagnosisRunHistory } from "./DiagnosisRunHistory";
import { DifficultyScoreCards } from "./DifficultyScoreCards";
import { DistributionCharts } from "./DistributionCharts";
import { FormulaBatchReplayResultsCard } from "./FormulaBatchReplayResultsCard";
import { FormulaCalibrationChart } from "./FormulaCalibrationChart";
import { FormulaPlaytestCompareTable } from "./FormulaPlaytestCompareTable";
import { GeminiAdvicePanel } from "./GeminiAdvicePanel";
import { SimilarityPairsTable } from "./SimilarityPairsTable";
import { SingleLevelDiagnosisPanel } from "./SingleLevelDiagnosisPanel";
import type { BatchReplaySummary, PlaytestCompareRow } from "../types";

type LevelOption = { id: string; name: string; levelIndex?: number | null };

type DiagnosisRun = {
  id: string;
  levelName?: string | null;
  formulaName?: string | null;
  createdAt: string;
};

type Props = {
  levels: LevelOption[];
  selectedLevelId: string;
  onSelectLevel: (id: string) => void;
  onDiagnose: () => void;
  recentCount: number;
  onRecentCountChange: (n: number) => void;
  onBatchReplay: () => void;
  loading: boolean;
  singleDiagnosis: DifficultyDiagnosisResult | null;
  batchSummary: BatchReplaySummary | null;
  batchResults: DifficultyDiagnosisResult[];
  batchAnomalies: DifficultyAnomaly[];
  advice: GeminiDifficultyAdviceResult | null;
  mockMode: boolean;
  onAskGemini: () => void;
  calibrationPoints: CalibrationPoint[];
  calibrationSummary?: { total: number; formulaMismatchCount: number; withActualPassRate: number };
  runs: DiagnosisRun[];
  playtestCompare: PlaytestCompareRow[];
};

export function FormulaDiagnosisWorkbench({
  levels,
  selectedLevelId,
  onSelectLevel,
  onDiagnose,
  recentCount,
  onRecentCountChange,
  onBatchReplay,
  loading,
  singleDiagnosis,
  batchSummary,
  batchResults,
  batchAnomalies,
  advice,
  mockMode,
  onAskGemini,
  calibrationPoints,
  calibrationSummary,
  runs,
  playtestCompare,
}: Props) {
  return (
    <div className="min-w-0 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <SingleLevelDiagnosisPanel
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectLevel={onSelectLevel}
          onDiagnose={onDiagnose}
        />
        <BatchReplayPanel
          recentCount={recentCount}
          onRecentCountChange={onRecentCountChange}
          onReplay={onBatchReplay}
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

      <GeminiAdvicePanel advice={advice} mockMode={mockMode} onAsk={onAskGemini} />

      <FormulaBatchReplayResultsCard summary={batchSummary} results={batchResults} anomalies={batchAnomalies} />

      <FormulaCalibrationChart points={calibrationPoints} summary={calibrationSummary} />

      <DiagnosisRunHistory runs={runs} />

      <FormulaPlaytestCompareTable rows={playtestCompare} />
    </div>
  );
}
