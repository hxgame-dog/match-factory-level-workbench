"use client";

import { useEffect, useMemo, useState } from "react";

import { useWorkspaceStore } from "@/stores/workspaceStore";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

import { ArtStylePanel } from "./ArtStylePanel";
import { AssetBatchHistory } from "./AssetBatchHistory";
import { AssetGrid } from "./AssetGrid";
import { AssetPromptDialog } from "./AssetPromptDialog";
import { AssetPromptPanel } from "./AssetPromptPanel";
import { GeminiStatusCompact } from "@/components/ai/GeminiStatusCompact";
import { pickAssetItemPayload } from "@/lib/assets/pickAssetItemPayload";
import { TaskProgressCard } from "@/components/ui/task-progress";
import { notify } from "@/lib/ui/notify";

import { ItemSetSelector } from "./ItemSetSelector";

type LoadedItem = {
  id?: string;
  sourceItemId?: number;
  catalogItemId?: string;
  name: string;
  displayName?: string;
  category1: string;
  category2?: string;
  color1?: string;
  color2?: string;
  shape?: string;
  size?: string;
  role?: string;
  count?: number;
  imagePrompt?: string;
};

type AssetDraft = LoadedItem & {
  assetId?: string;
  prompt: string;
  negativePrompt: string;
  status: string;
  imageUrl?: string;
  error?: string;
};

type Batch = {
  id: string;
  name: string;
  itemSetName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
};

type Props = {
  itemSets: GeneratedItemSetListItem[];
  batches: Batch[];
  imageModel: string;
  imageGenerationReady: boolean;
};

const DEFAULT_STYLE =
  "stylized 3D cartoon mobile puzzle game item asset, soft toy-like material, clean shape, centered object, orthographic camera, consistent studio lighting, simple readable silhouette, suitable for Match 3D object collection game";
const DEFAULT_NEGATIVE =
  "text, watermark, logo, human, character, complex background, messy scene, realistic photo, horror, gore, weapon, low quality, blurry, distorted object";

export function AssetStudioPage({
  itemSets: initSets,
  batches: initBatches,
  imageModel,
  imageGenerationReady,
}: Props) {
  const [itemSets, setItemSets] = useState(initSets);
  const [batches, setBatches] = useState(initBatches);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [currentItems, setCurrentItems] = useState<LoadedItem[]>([]);
  const [assets, setAssets] = useState<AssetDraft[]>([]);
  const [detail, setDetail] = useState<Props["itemSets"][number] | null>(null);
  const [globalArtStyle, setGlobalArtStyle] = useState(DEFAULT_STYLE);
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE);
  const [imageSize, setImageSize] = useState<"512x512" | "768x768" | "1024x1024">("512x512");
  const [backgroundMode, setBackgroundMode] = useState<"transparent" | "plain" | "studio">("plain");
  const [outputFormat, setOutputFormat] = useState<"svg" | "png">("svg");
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState({ total: 0, done: 0, failed: 0 });
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [promptGenerating, setPromptGenerating] = useState(false);
  const [promptProgress, setPromptProgress] = useState<{ current: number; total: number; label: string } | null>(
    null,
  );
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeId);

  useEffect(() => {
    if (!activeWorkspaceId || activeWorkspaceId === selectedSetId) return;
    setSelectedSetId(activeWorkspaceId);
    void loadItemSet(activeWorkspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在工作区切换时自动加载
  }, [activeWorkspaceId]);

  async function refreshItemSets() {
    const response = await fetch("/api/generated-item-sets");
    const payload = await response.json();
    if (payload.success) setItemSets(payload.data);
  }

  async function refreshBatches() {
    const response = await fetch("/api/assets/batches");
    const payload = await response.json();
    if (payload.success) setBatches(payload.data);
  }

  async function loadItemSet(setId?: string) {
    const id = setId ?? selectedSetId;
    if (!id) return;
    if (!setId) setSelectedSetId(id);
    setError(null);
    const response = await fetch(`/api/generated-item-sets/${id}`);
    const payload = await response.json();
    if (!payload.success) {
      setError(payload.error ?? "加载失败");
      return;
    }
    const set = payload.data;
    setDetail({
      id: set.id,
      name: set.name,
      theme: set.theme,
      itemCount: set.items.length,
      createdAt: set.createdAt,
    });
    setCurrentItems(set.items);
    setAssets(
      set.items.map((item: LoadedItem) => ({
        ...item,
        prompt: item.imagePrompt ?? "",
        negativePrompt,
        status: "pending",
      })),
    );
  }

  async function generatePrompts(regenerate = false) {
    if (assets.length === 0) {
      notify.warning("请先加载道具集");
      return;
    }
    setPromptGenerating(true);
    const loadingToast = notify.loading(`正在生成 Prompt（${assets.length} 个道具）…`);
    const next = [...assets];
    try {
    for (let i = 0; i < next.length; i += 1) {
      setPromptProgress({ current: i + 1, total: next.length, label: next[i].name });
      if (!regenerate && next[i].prompt) {
        next[i].status = "prompt_ready";
        continue;
      }
      const response = await fetch("/api/ai/assets/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: pickAssetItemPayload(next[i] as unknown as Record<string, unknown>),
          globalArtStyle,
          negativePrompt,
        }),
      });
      const payload = await response.json();
      if (!payload.success) {
        next[i].status = "failed";
        continue;
      }
      next[i].prompt = payload.data.prompt;
      next[i].negativePrompt = payload.data.negativePrompt ?? negativePrompt;
      next[i].status = "prompt_ready";
    }
    setAssets(next);
    const ready = next.filter((a) => a.status === "prompt_ready").length;
    const failed = next.filter((a) => a.status === "failed").length;
    if (failed > 0) {
      notify.warning("Prompt 已更新（部分失败）", `就绪 ${ready} 条，失败 ${failed} 条`);
    } else {
      notify.success("Prompt 已生成", `共 ${ready} 条道具可进入批量出图`);
    }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Prompt 生成失败";
      setError(message);
      notify.error("Prompt 生成失败", message);
    } finally {
      notify.dismiss(loadingToast);
      setPromptGenerating(false);
      setPromptProgress(null);
    }
  }

  async function generateOne(index: number) {
    const asset = assets[index];
    if (!asset.prompt) {
      setError("Prompt 为空，无法生成");
      return;
    }
    const response = await fetch("/api/assets/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: asset.assetId,
        item: pickAssetItemPayload(asset as unknown as Record<string, unknown>),
        prompt: asset.prompt,
        negativePrompt: asset.negativePrompt,
        imageSize,
        backgroundMode,
        provider: imageGenerationReady ? "gemini" : "mock",
      }),
    });
    const payload = await response.json();
    if (!payload.success) {
      const next = [...assets];
      next[index].status = "failed";
      next[index].error = payload.error ?? "生成失败";
      setAssets(next);
      setError(payload.error ?? "生成失败");
      return;
    }
    const next = [...assets];
    next[index].status = payload.data.status;
    next[index].imageUrl = payload.data.imageUrl;
    next[index].error = payload.data.error;
    if (payload.data.status === "failed") {
      setError(payload.data.error ?? "图片生成失败");
    }
    setAssets(next);
  }

  async function generateAll() {
    if (!selectedSetId) {
      const message = "请先选择道具集";
      setError(message);
      notify.warning(message);
      return;
    }
    setError(null);
    setProgress({ total: assets.length, done: 0, failed: 0 });
    setBatchGenerating(true);
    const loadingToast = notify.loading(`正在批量出图（${assets.length} 个道具），请勿关闭页面…`);
    try {
    const response = await fetch("/api/assets/generate-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemSetId: selectedSetId,
        batchName: `${detail?.name ?? "batch"}-${Date.now()}`,
        globalArtStyle,
        negativePrompt,
        imageSize,
        backgroundMode,
      }),
    });
    const payload = await response.json();
    if (!payload.success) {
      const message = payload.error ?? "批量生成失败";
      setError(message);
      notify.dismiss(loadingToast);
      notify.error("批量出图失败", message);
      setBatchGenerating(false);
      return;
    }
    setProgress({
      total: payload.data.totalCount,
      done: payload.data.successCount,
      failed: payload.data.failedCount,
    });
    const { successCount, failedCount, totalCount } = payload.data;
    if (failedCount > 0) {
      const message = `成功 ${successCount} / ${totalCount}，失败 ${failedCount}`;
      setError(`批量生成完成：${message}`);
      notify.warning("批量出图完成（部分失败）", message);
    } else {
      notify.success("批量出图完成", `共 ${successCount} 张图片已生成`);
    }
    await refreshBatches();
    if (payload.data.batchId) {
      await openBatch(payload.data.batchId);
    }
    } catch (e) {
      const message = e instanceof Error ? e.message : "批量出图失败";
      setError(message);
      notify.error("批量出图失败", message);
    } finally {
      notify.dismiss(loadingToast);
      setBatchGenerating(false);
    }
  }

  async function openBatch(id: string) {
    const response = await fetch(`/api/assets/batches/${id}`);
    const payload = await response.json();
    if (!payload.success) return;
    const batch = payload.data;
    setAssets(
      batch.assets.map((asset: AssetDraft & { id?: string; error?: string }) => ({
        ...asset,
        assetId: asset.id,
        error: asset.error ?? undefined,
      })),
    );
    setProgress({
      total: batch.totalCount,
      done: batch.successCount,
      failed: batch.failedCount,
    });
  }

  async function deleteBatch(id: string) {
    await fetch(`/api/assets/batches/${id}`, { method: "DELETE" });
    await refreshBatches();
  }

  async function exportZip() {
    if (batches.length === 0) return;
    const batchId = batches[0].id;
    const response = await fetch(`/api/assets/batches/${batchId}/export-zip`, { method: "POST" });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset_batch_${batchId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportMapping() {
    if (batches.length === 0) return;
    const response = await fetch(`/api/assets/batches/${batches[0].id}/mapping`);
    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mapping.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const editingAsset = editingIndex == null ? null : assets[editingIndex];
  const detailInfo = useMemo(() => {
    if (!detail) return undefined;
    const targets = currentItems.filter((item) => item.role === "target").length;
    const distractors = currentItems.filter((item) => item.role === "distractor").length;
    return {
      name: detail.name,
      theme: detail.theme,
      total: detail.itemCount,
      targetCount: targets,
      distractorCount: distractors,
      createdAt: detail.createdAt,
    };
  }, [currentItems, detail]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <GeminiStatusCompact mode="image" imageModel={imageModel} available={imageGenerationReady} />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {promptGenerating && promptProgress ? (
        <TaskProgressCard
          title="正在生成 Prompt"
          description={`当前：${promptProgress.label}`}
          current={promptProgress.current}
          total={promptProgress.total}
        />
      ) : null}
      {batchGenerating ? (
        <TaskProgressCard
          title="正在批量出图"
          description="服务端逐张生成，耗时取决于道具数量与模型速度"
          current={0}
          total={assets.length || 1}
          indeterminate
        />
      ) : null}
      {!batchGenerating && progress.total > 0 ? (
        <TaskProgressCard
          title="批量出图结果"
          description={`成功 ${progress.done} · 失败 ${progress.failed}`}
          current={progress.done + progress.failed}
          total={progress.total}
        />
      ) : null}

      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <ItemSetSelector
          itemSets={itemSets}
          selectedId={selectedSetId}
          onChange={setSelectedSetId}
          onLoad={loadItemSet}
          onRefresh={refreshItemSets}
          detail={detailInfo}
        />
        <ArtStylePanel
          globalArtStyle={globalArtStyle}
          negativePrompt={negativePrompt}
          imageSize={imageSize}
          backgroundMode={backgroundMode}
          outputFormat={outputFormat}
          onChange={(next) => {
            if (next.globalArtStyle !== undefined) setGlobalArtStyle(next.globalArtStyle);
            if (next.negativePrompt !== undefined) setNegativePrompt(next.negativePrompt);
            if (next.imageSize !== undefined) setImageSize(next.imageSize);
            if (next.backgroundMode !== undefined) setBackgroundMode(next.backgroundMode);
            if (next.outputFormat !== undefined) setOutputFormat(next.outputFormat);
          }}
        />
        <AssetPromptPanel
          onGeneratePrompts={() => void generatePrompts(false)}
          onRegeneratePrompts={() => void generatePrompts(true)}
          onClearPrompts={() =>
            setAssets((prev) => prev.map((asset) => ({ ...asset, prompt: "", status: "pending" })))
          }
        />
        </div>

        <div className="space-y-4 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">图片生成与预览</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void generateAll()} disabled={batchGenerating || promptGenerating || !selectedSetId}>
              {batchGenerating ? "出图中…" : "批量出图"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                assets.forEach((asset, index) => {
                  if (asset.status === "failed") void generateOne(index);
                });
              }}
            >
              重试失败项
            </Button>
            <Button variant="outline" onClick={() => void refreshBatches()}>
              刷新批次
            </Button>
            <Button variant="outline" onClick={() => void exportZip()}>
              导出 ZIP
            </Button>
            <Button variant="outline" onClick={() => void exportMapping()}>
              导出 Mapping
            </Button>
          </div>
          <AssetGrid
            assets={assets}
            onEditPrompt={(index) => setEditingIndex(index)}
            onGenerate={(index) => void generateOne(index)}
            onRetry={(index) => {
              const id = assets[index]?.assetId;
              if (id) {
                void fetch(`/api/assets/${id}/retry`, { method: "POST" }).then(() => generateOne(index));
              } else {
                void generateOne(index);
              }
            }}
            onSkip={(index) =>
              setAssets((prev) =>
                prev.map((asset, i) => (i === index ? { ...asset, status: "skipped" } : asset)),
              )
            }
            onMarkDone={(index) =>
              setAssets((prev) =>
                prev.map((asset, i) => (i === index ? { ...asset, status: "done" } : asset)),
              )
            }
          />
        </CardContent>
      </Card>
        </div>
      </div>

      <AssetBatchHistory batches={batches} onOpen={(id) => void openBatch(id)} onDelete={(id) => void deleteBatch(id)} />

      <AssetPromptDialog
        open={editingAsset != null}
        prompt={editingAsset?.prompt ?? ""}
        negativePrompt={editingAsset?.negativePrompt ?? ""}
        onChange={(next) => {
          if (editingIndex == null) return;
          setAssets((prev) =>
            prev.map((asset, index) =>
              index === editingIndex ? { ...asset, ...next, status: "prompt_ready" } : asset,
            ),
          );
        }}
        onSave={() => {
          if (editingIndex == null) return;
          const asset = assets[editingIndex];
          if (asset.assetId) {
            void fetch(`/api/assets/${asset.assetId}/update-prompt`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: asset.prompt,
                negativePrompt: asset.negativePrompt,
              }),
            });
          }
          setEditingIndex(null);
        }}
        onClose={() => setEditingIndex(null)}
      />
    </div>
  );
}
