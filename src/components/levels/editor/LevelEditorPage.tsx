"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generatorRulePresets, refreshRulePresets } from "@/lib/level/rulePresets";
import { useLevelEditorStore } from "@/stores/levelEditorStore";
import type { LevelConfig, LevelItemEntry } from "@/types/level";

import { LevelBasicConfigPanel } from "./LevelBasicConfigPanel";
import { LevelBoardPreview } from "./LevelBoardPreview";
import { LevelDifficultyPanel } from "./LevelDifficultyPanel";
import { LevelItemTabs } from "./LevelItemTabs";
import { LevelJsonActions } from "./LevelJsonActions";
import { LevelJsonPreviewDialog } from "./LevelJsonPreviewDialog";
import { LevelSelector } from "./LevelSelector";
import { LevelValidationPanel } from "./LevelValidationPanel";
import { LevelEditorAnalyticsPanel } from "@/features/analytics";
import { buttonVariants } from "@/components/ui/button";
import { WorkspaceFilterBanner } from "@/components/shell/WorkspaceFilterBanner";
import { hrefWithWorkspace } from "@/lib/workspace/pipeline";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspaceStore";

type LevelRow = {
  id: string;
  name: string;
  levelIndex: number | null;
  theme: string | null;
  targetDifficulty: string | null;
  status: string;
  itemSetId: string;
  createdAt: string;
  updatedAt: string;
};

export function LevelEditorPage({ initialLevels }: { initialLevels: LevelRow[] }) {
  const [levels, setLevels] = useState(initialLevels);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeId);
  const visibleLevels = useMemo(() => {
    if (!activeWorkspaceId) return levels;
    return levels.filter((l) => l.itemSetId === activeWorkspaceId);
  }, [levels, activeWorkspaceId]);
  const [selectedId, setSelectedId] = useState("");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [playtestBrief, setPlaytestBrief] = useState<{
    passRate: number;
    avgRemainingTime: number;
    mainFailReason?: string;
    issueCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiMode] = useState("AI Mock Mode");
  const {
    level,
    sourceItems,
    assets,
    dirty,
    validation,
    difficulty,
    boardPreview,
    setContext,
    updateBasicConfig,
    setValidation,
    setDifficulty,
    setBoardPreview,
    resetChanges,
  } = useLevelEditorStore();

  async function refreshLevels() {
    const response = await fetch("/api/generated-levels");
    const payload = await response.json();
    if (payload.success) {
      setLevels(
        payload.data.map((row: LevelRow & { itemSetId?: string }) => ({
          id: row.id,
          name: row.name,
          levelIndex: row.levelIndex,
          theme: row.theme,
          targetDifficulty: row.targetDifficulty,
          status: row.status,
          itemSetId: row.itemSetId ?? "",
          createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date(row.createdAt).toISOString(),
          updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : new Date(row.updatedAt).toISOString(),
        })),
      );
    }
  }

  useEffect(() => {
    if (!selectedId) return;
    if (!visibleLevels.some((l) => l.id === selectedId)) setSelectedId("");
  }, [visibleLevels, selectedId]);

  async function loadContext() {
    if (!selectedId) return;
    setError(null);
    const response = await fetch(`/api/level-editor/context/${selectedId}`);
    const payload = await response.json();
    if (!payload.success) {
      setError(payload.error ?? "加载失败");
      return;
    }
    setContext({
      level: payload.data.level as LevelConfig,
      sourceItems: (payload.data.sourceItems as LevelItemEntry[]).map((item) => ({
        ...item,
        role: item.role as LevelItemEntry["role"],
        assetKey: item.name,
      })),
      assets: payload.data.assets,
      selectedLevelId: selectedId,
    });
  }

  useEffect(() => {
    if (!level) return;
    const timer = setTimeout(async () => {
      const validationRes = await fetch("/api/level-editor/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          sourceItems: sourceItems.map((item) => ({ name: item.name, role: item.role })),
        }),
      }).then((r) => r.json());
      if (validationRes.success) {
        setValidation(validationRes.validation);
        setDifficulty(validationRes.difficulty);
      }
      const previewRes = await fetch("/api/level-editor/preview-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      }).then((r) => r.json());
      if (previewRes.success) setBoardPreview(previewRes.data);
    }, 500);
    return () => clearTimeout(timer);
  }, [level, sourceItems, setBoardPreview, setDifficulty, setValidation]);

  async function save() {
    if (!level || !selectedId) return;
    const response = await fetch(`/api/level-editor/save/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
    const payload = await response.json();
    if (!payload.success) {
      setError(payload.error ?? "保存失败");
      return;
    }
    setContext({
      level: payload.level,
      sourceItems,
      assets,
      selectedLevelId: selectedId,
    });
    await refreshLevels();
  }

  async function saveAsCopy() {
    if (!level || !selectedId) return;
    const response = await fetch(`/api/level-editor/save-as-copy/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
    const payload = await response.json();
    if (!payload.success) {
      setError(payload.error ?? "保存副本失败");
      return;
    }
    await refreshLevels();
  }

  const assetsMap = useMemo(() => {
    const entries = assets.map((asset) => [asset.name, { imageUrl: asset.imageUrl, localPath: asset.localPath, prompt: asset.prompt }]);
    return Object.fromEntries(entries);
  }, [assets]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge>{aiMode}</Badge>
        {dirty ? <Badge variant="secondary">Unsaved Changes</Badge> : null}
        <Button
          variant="outline"
          onClick={async () => {
            if (!selectedId) return;
            const result = await fetch("/api/playtest/simulate-level", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                levelId: selectedId,
                config: {
                  simulationCount: 100,
                  playerProfiles: [
                    { id: "normal", name: "Normal Player", weight: 1, skillLevel: "normal", scanSpeed: 0.85, mistakeRate: 0.1, targetPriority: 0.78, distractorClickChance: 0.07, memoryFactor: 0.55, panicFactor: 0.25 },
                  ],
                  rules: { slotCapacity: 7, matchRequiredCount: 3, allowShuffleAssist: false, allowHintAssist: false, allowBoosterAssist: false },
                  strategy: { selectionStrategy: "target_first", considerSimilarity: true, considerSize: true, considerLayerBlocking: true, considerRefreshRules: true },
                  qaThresholds: { minPassRate: 0.65, maxPassRate: 0.98, minAvgRemainingTime: 10, maxAvgRemainingTime: 120, maxSlotPressure: 0.85, maxTargetStarvationTurns: 8, maxWarningCount: 5 },
                },
                saveRun: true,
              }),
            }).then((r) => r.json());
            if (result.success) {
              const sim = result.data.result;
              setPlaytestBrief({
                passRate: sim.metrics.passRate,
                avgRemainingTime: sim.metrics.avgRemainingTime,
                mainFailReason: sim.failReasons?.[0]?.reason,
                issueCount: sim.qaIssues?.length ?? 0,
              });
            }
          }}
        >
          Run Playtest
        </Button>
        <Link
          href={hrefWithWorkspace("/playtest-simulator", activeWorkspaceId)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          在试玩模拟器中打开
        </Link>
      </div>
      {playtestBrief ? (
        <Alert>
          <AlertTitle>Playtest 快速结果</AlertTitle>
          <AlertDescription>
            Pass Rate {(playtestBrief.passRate * 100).toFixed(1)}%，Avg Remaining Time {playtestBrief.avgRemainingTime.toFixed(1)}s，Main Fail {playtestBrief.mainFailReason ?? "-"}，QA Issues {playtestBrief.issueCount}
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <WorkspaceFilterBanner totalCount={levels.length} filteredCount={visibleLevels.length} />
      <LevelSelector
        levels={visibleLevels}
        selectedLevelId={selectedId}
        onSelect={setSelectedId}
        onLoad={() => void loadContext()}
        onRefresh={() => void refreshLevels()}
        onDuplicate={() => void saveAsCopy()}
        onExport={() => {
          if (!selectedId) return;
          const a = document.createElement("a");
          a.href = `/api/generated-levels/${selectedId}/export`;
          a.click();
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(280px,1.2fr)_minmax(260px,300px)]">
        <Card>
          <CardHeader><CardTitle className="text-lg">基础配置与道具编辑</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {level ? (
              <>
                <LevelBasicConfigPanel
                  level={level}
                  generatorRules={generatorRulePresets}
                  refreshRules={refreshRulePresets}
                  onChange={updateBasicConfig}
                />
                <LevelItemTabs
                  level={level}
                  sourceItems={sourceItems}
                  assets={assetsMap}
                  onChange={updateBasicConfig}
                />
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">请先加载关卡</div>
            )}
          </CardContent>
        </Card>
        <LevelBoardPreview
          preview={boardPreview as never}
          level={level}
          onRefresh={(filter) => {
            if (!level) return;
            void fetch("/api/level-editor/preview-board", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ level, filter, seed: "level-editor" }),
            })
              .then((r) => r.json())
              .then((payload) => payload.success && setBoardPreview(payload.data));
          }}
        />
        <div className="space-y-3">
          <LevelValidationPanel validation={validation as never} />
          <LevelDifficultyPanel difficulty={difficulty as never} />
          {selectedId ? (
            <LevelEditorAnalyticsPanel levelId={selectedId} levelName={level?.name ?? levels.find((l) => l.id === selectedId)?.name} />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">JSON 预览与操作</CardTitle></CardHeader>
        <CardContent>
          <LevelJsonActions
            onPreview={() => setJsonOpen(true)}
            onCopy={async () => {
              if (!level) return;
              await navigator.clipboard.writeText(JSON.stringify(level, null, 2));
            }}
            onSave={() => void save()}
            onSaveAsCopy={() => void saveAsCopy()}
            onExport={() => {
              if (!level) return;
              const file = { schemaVersion: 1, type: "match3d_level_config", level };
              const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `level_${level.levelIndex ?? "x"}_${level.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            onReset={resetChanges}
          />
        </CardContent>
      </Card>

      <LevelJsonPreviewDialog open={jsonOpen} level={level} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
