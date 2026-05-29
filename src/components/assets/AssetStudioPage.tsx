"use client";

import { useMemo, useState } from "react";

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
import { GeminiSettingsPanel } from "@/components/ai/GeminiSettingsPanel";
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
  mockMode: boolean;
  hasGeminiKey: boolean;
  imageGenerationReady: boolean;
};

const DEFAULT_STYLE =
  "stylized 3D cartoon mobile puzzle game item asset, soft toy-like material, clean shape, centered object, orthographic camera, consistent studio lighting, simple readable silhouette, suitable for Match 3D object collection game";
const DEFAULT_NEGATIVE =
  "text, watermark, logo, human, character, complex background, messy scene, realistic photo, horror, gore, weapon, low quality, blurry, distorted object";

export function AssetStudioPage({
  itemSets: initSets,
  batches: initBatches,
  mockMode,
  hasGeminiKey,
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

  const modeText = imageGenerationReady
    ? "Gemini 真实出图"
    : mockMode
      ? "AI Mock 模式"
      : hasGeminiKey
        ? "Gemini（已配置 Key）"
        : "待配置 Gemini Key";

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

  async function loadItemSet() {
    if (!selectedSetId) return;
    setError(null);
    const response = await fetch(`/api/generated-item-sets/${selectedSetId}`);
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
    const next = [...assets];
    for (let i = 0; i < next.length; i += 1) {
      if (!regenerate && next[i].prompt) {
        next[i].status = "prompt_ready";
        continue;
      }
      const response = await fetch("/api/ai/assets/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: next[i],
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
        item: asset,
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
      setAssets(next);
      return;
    }
    const next = [...assets];
    next[index].status = payload.data.status;
    next[index].imageUrl = payload.data.imageUrl;
    setAssets(next);
  }

  async function generateAll() {
    if (!selectedSetId) {
      setError("请先选择 Item Set");
      return;
    }
    setError(null);
    setProgress({ total: assets.length, done: 0, failed: 0 });

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
      setError(payload.error ?? "批量生成失败");
      return;
    }
    setProgress({
      total: payload.data.totalCount,
      done: payload.data.successCount,
      failed: payload.data.failedCount,
    });
    await refreshBatches();
  }

  async function openBatch(id: string) {
    const response = await fetch(`/api/assets/batches/${id}`);
    const payload = await response.json();
    if (!payload.success) return;
    const batch = payload.data;
    setAssets(
      batch.assets.map((asset: AssetDraft) => ({
        ...asset,
        assetId: asset.id,
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge>{modeText}</Badge>
        {!mockMode && !hasGeminiKey ? <Badge variant="destructive">未配置 Gemini Key</Badge> : null}
      </div>
      <GeminiSettingsPanel compact />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>操作失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
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
      </div>

      <AssetPromptPanel
        onGeneratePrompts={() => void generatePrompts(false)}
        onRegeneratePrompts={() => void generatePrompts(true)}
        onClearPrompts={() =>
          setAssets((prev) => prev.map((asset) => ({ ...asset, prompt: "", status: "pending" })))
        }
      />

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">图片生成与预览区</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void generateAll()}>Generate All</Button>
            <Button
              variant="outline"
              onClick={() => {
                assets.forEach((asset, index) => {
                  if (asset.status === "failed") void generateOne(index);
                });
              }}
            >
              Retry Failed
            </Button>
            <Button variant="outline">Stop / Cancel</Button>
            <Button variant="outline" onClick={() => void refreshBatches()}>
              Save Batch
            </Button>
            <Button variant="outline" onClick={() => void exportZip()}>
              Export ZIP
            </Button>
            <Button variant="outline" onClick={() => void exportMapping()}>
              Export Mapping JSON
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            进度：已完成 {progress.done} / 失败 {progress.failed} / 总计 {progress.total}
          </p>
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
