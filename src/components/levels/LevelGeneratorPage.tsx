"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LevelConfig } from "@/types/level";

import { LevelBasicConfigForm } from "./LevelBasicConfigForm";
import { LevelCandidateList } from "./LevelCandidateList";
import { LevelJsonPreviewDialog } from "./LevelJsonPreviewDialog";
import { LevelRulePresetSelector } from "./LevelRulePresetSelector";
import { LevelSourceSelector } from "./LevelSourceSelector";
import { GeneratedLevelHistory } from "./GeneratedLevelHistory";

type ItemSet = { id: string; name: string; theme: string; itemCount: number };
type Batch = { id: string; name: string; itemSetId: string; successCount: number; totalCount: number };
type History = { id: string; name: string; levelIndex: number | null; theme: string | null; targetDifficulty: string | null; createdAt: string };
type Rule = { id: string; name: string; difficultyValue: number; description: string };
type Validation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    targetTypeCount: number;
    targetTotalCount: number;
    spawnTypeCount: number;
    spawnTotalCount: number;
    distractorTypeCount: number;
    missingAssetCount: number;
  };
};

export function LevelGeneratorPage(props: {
  itemSets: ItemSet[];
  batches: Batch[];
  history: History[];
  generatorRules: Rule[];
  refreshRules: Rule[];
}) {
  const [itemSets] = useState(props.itemSets);
  const [batches] = useState(props.batches);
  const [history, setHistory] = useState(props.history);
  const [selectedItemSetId, setSelectedItemSetId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [config, setConfig] = useState({
    levelName: "Breakfast Level",
    levelIndex: 1,
    targetDifficulty: "normal" as "easy" | "normal" | "hard" | "expert",
    timeLimitSec: 180,
    slotCount: 7,
    boardWidth: 8,
    boardHeight: 8,
    layerCount: 3,
    layoutMode: "clustered" as "flat" | "stacked" | "clustered" | "random",
    candidateCount: 3,
    generatorRuleId: props.generatorRules[1]?.id ?? props.generatorRules[0]?.id ?? "",
    refreshRuleId: props.refreshRules[1]?.id ?? props.refreshRules[0]?.id ?? "",
  });
  const [summary, setSummary] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<LevelConfig[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateCandidates() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/levels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelName: config.levelName,
          levelIndex: config.levelIndex,
          targetDifficulty: config.targetDifficulty,
          candidateCount: config.candidateCount,
          source: {
            itemSetId: selectedItemSetId,
            assetBatchId: selectedBatchId || undefined,
          },
          config: {
            timeLimitSec: config.timeLimitSec,
            slotCount: config.slotCount,
            boardWidth: config.boardWidth,
            boardHeight: config.boardHeight,
            layerCount: config.layerCount,
            layoutMode: config.layoutMode,
            generatorRuleId: config.generatorRuleId,
            refreshRuleId: config.refreshRuleId,
          },
        }),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error ?? "生成失败");
      setSummary(payload.data.summary);
      setWarnings(payload.data.warnings ?? []);
      setCandidates(payload.data.candidates ?? []);
      setValidations(payload.validations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  async function saveCandidate(index: number) {
    const c = candidates[index];
    const v = validations[index];
    const set = itemSets.find((x) => x.id === selectedItemSetId);
    const batch = batches.find((x) => x.id === selectedBatchId);
    const response = await fetch("/api/generated-levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: c.name,
        levelIndex: c.levelIndex,
        theme: c.theme,
        itemSetId: selectedItemSetId,
        itemSetName: set?.name ?? "",
        assetBatchId: selectedBatchId || undefined,
        assetBatchName: batch?.name,
        targetDifficulty: c.rules.targetDifficulty,
        generatorRuleId: c.rules.generatorRuleId,
        refreshRuleId: c.rules.refreshRuleId,
        summary,
        warnings,
        validation: v,
        level: c,
      }),
    });
    const payload = await response.json();
    if (payload.success) {
      const rows = await fetch("/api/generated-levels").then((r) => r.json());
      if (rows.success) setHistory(rows.data);
    }
  }

  function exportCandidate(index: number) {
    const c = candidates[index];
    const file = {
      schemaVersion: 1,
      type: "match3d_level_config",
      level: c,
    };
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `level_${c.levelIndex ?? "x"}_${c.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive"><AlertTitle>请求失败</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <LevelSourceSelector
          itemSets={itemSets}
          batches={batches}
          selectedItemSetId={selectedItemSetId}
          selectedBatchId={selectedBatchId}
          onChange={(next) => {
            if (next.itemSetId !== undefined) setSelectedItemSetId(next.itemSetId);
            if (next.batchId !== undefined) setSelectedBatchId(next.batchId);
          }}
          onLoad={() => {}}
        />
        <LevelBasicConfigForm
          values={{
            levelName: config.levelName,
            levelIndex: config.levelIndex,
            targetDifficulty: config.targetDifficulty,
            timeLimitSec: config.timeLimitSec,
            slotCount: config.slotCount,
            boardWidth: config.boardWidth,
            boardHeight: config.boardHeight,
            layerCount: config.layerCount,
            layoutMode: config.layoutMode,
            candidateCount: config.candidateCount,
          }}
          onChange={(next) => setConfig((prev) => ({ ...prev, ...next }))}
        />
      </div>
      <LevelRulePresetSelector
        generatorRules={props.generatorRules}
        refreshRules={props.refreshRules}
        selectedGeneratorRuleId={config.generatorRuleId}
        selectedRefreshRuleId={config.refreshRuleId}
        onChange={(next) => setConfig((prev) => ({ ...prev, ...next }))}
      />
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader><CardTitle className="text-lg">候选关卡生成区</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={() => void generateCandidates()} disabled={loading}>{loading ? "生成中..." : "Generate Level Candidates"}</Button>
            <Button variant="outline" onClick={() => void generateCandidates()}>Regenerate</Button>
            <Button variant="outline" onClick={() => { setCandidates([]); setWarnings([]); setSummary(""); }}>Clear</Button>
          </div>
          {summary ? <p className="text-sm text-gray-700">{summary}</p> : null}
          {warnings.length > 0 ? <p className="text-sm text-amber-700">{warnings.join("；")}</p> : null}
          <LevelCandidateList
            candidates={candidates}
            validations={validations}
            onPreview={setPreviewIndex}
            onSave={(i) => void saveCandidate(i)}
            onExport={exportCandidate}
          />
        </CardContent>
      </Card>
      <GeneratedLevelHistory
        rows={history}
        onOpen={async (id) => {
          const response = await fetch(`/api/generated-levels/${id}`);
          const payload = await response.json();
          if (payload.success) {
            setCandidates([payload.data.level]);
            setValidations([payload.data.validation ?? { isValid: true, errors: [], warnings: [], stats: { targetTypeCount: 0, targetTotalCount: 0, spawnTypeCount: 0, spawnTotalCount: 0, distractorTypeCount: 0, missingAssetCount: 0 } }]);
          }
        }}
        onDelete={async (id) => {
          await fetch(`/api/generated-levels/${id}`, { method: "DELETE" });
          const rows = await fetch("/api/generated-levels").then((r) => r.json());
          if (rows.success) setHistory(rows.data);
        }}
        onExport={(id) => {
          const a = document.createElement("a");
          a.href = `/api/generated-levels/${id}/export`;
          a.click();
        }}
      />
      <LevelJsonPreviewDialog
        open={previewIndex != null}
        json={previewIndex == null ? {} : candidates[previewIndex]}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  );
}
