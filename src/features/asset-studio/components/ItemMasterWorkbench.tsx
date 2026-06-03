"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Scissors } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemBaseName } from "@/lib/items/itemName";
import { getPaletteColorLabel } from "@/lib/items/colorPalette";
import { notify } from "@/lib/ui/notify";

import { MasterItemCard } from "./MasterItemCard";
import { VariantSheetCard } from "./VariantSheetCard";

type ItemLike = {
  id?: string;
  name: string;
  displayName?: string;
  category1?: string;
  color1?: string;
  color2?: string;
  shape?: string;
  size?: string;
  pattern?: string;
  role?: string;
};

type BatchAsset = {
  id: string;
  name: string;
  displayName?: string | null;
  category1: string;
  color1?: string | null;
  size?: string | null;
  pattern?: string | null;
  role?: string | null;
  status: string;
  prompt: string;
  imageUrl?: string | null;
  error?: string | null;
  sheetIndex?: number | null;
  generatedItemId?: string | null;
};

type SheetTemplate = {
  id: string;
  baseItemName: string;
  status: "draft" | "generating" | "ready" | "approved" | "split" | "failed";
  anchorGeneratedItemId?: string;
  sheetImageUrl?: string | null;
  sheetPrompt?: string | null;
  sheetSize?: string | null;
  shape?: string;
  size?: string;
  pattern?: string;
};

type Props = {
  selectedSetId: string;
  itemSetName?: string;
  currentItems: ItemLike[];
  globalArtStyle: string;
  negativePrompt: string;
  imageSize: "512x512" | "768x768" | "1024x1024";
  backgroundMode: "transparent" | "plain" | "studio";
  styleProfileId?: string;
  sheetSize?: string;
  currentBatchId?: string;
  onPlanned?: (batchId: string) => void;
  onBatchAssetsUpdated?: (assets: BatchAsset[]) => void;
};

export function ItemMasterWorkbench(props: Props) {
  const sheetSize = props.sheetSize ?? "2048x1024";
  const [batchId, setBatchId] = useState<string>(props.currentBatchId ?? "");
  const [templates, setTemplates] = useState<SheetTemplate[]>([]);
  const [batchAssets, setBatchAssets] = useState<BatchAsset[]>([]);
  const [activeBaseItemName, setActiveBaseItemName] = useState<string>("");
  const [planning, setPlanning] = useState(false);
  const [sheetGenerating, setSheetGenerating] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [approving, setApproving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, ItemLike[]>();
    for (const item of props.currentItems) {
      const base = getItemBaseName(item as never);
      const list = map.get(base) ?? [];
      list.push(item);
      map.set(base, list);
    }
    return Array.from(map.entries()).map(([baseItemName, items]) => ({ baseItemName, items }));
  }, [props.currentItems]);

  const activeTemplate = templates.find((t) => t.baseItemName === activeBaseItemName);
  const activeGroup = grouped.find((g) => g.baseItemName === activeBaseItemName);

  const groupItems = activeGroup?.items ?? [];

  const templateStats = useMemo(() => {
    const total = templates.length;
    const split = templates.filter((t) => t.status === "split").length;
    const approved = templates.filter((t) => t.status === "approved").length;
    const ready = templates.filter((t) => t.status === "ready").length;
    return { total, split, approved, ready };
  }, [templates]);

  function getStatusLabel(status?: SheetTemplate["status"]) {
    switch (status) {
      case "split":
        return "已切图";
      case "approved":
        return "已确认";
      case "ready":
        return "待确认";
      case "generating":
        return "生成中";
      case "failed":
        return "失败";
      default:
        return "草稿";
    }
  }

  async function refreshBatchAssets(id: string) {
    const payload = await fetch(`/api/assets/batches/${id}`).then((r) => r.json());
    if (!payload.success) return;
    const data = payload.data as { assets: BatchAsset[]; masters?: SheetTemplate[] };
    setBatchAssets(data.assets);
    if (data.masters?.length) {
      setTemplates(
        data.masters.map((m) => ({
          id: m.id,
          baseItemName: m.baseItemName,
          status: m.status as SheetTemplate["status"],
          anchorGeneratedItemId: m.anchorGeneratedItemId ?? undefined,
          sheetImageUrl: m.sheetImageUrl,
          sheetPrompt: m.sheetPrompt,
          sheetSize: m.sheetSize,
          shape: m.shape ?? undefined,
          size: m.size ?? undefined,
          pattern: m.pattern ?? undefined,
        })),
      );
    }
    props.onBatchAssetsUpdated?.(data.assets);
  }

  useEffect(() => {
    if (props.currentBatchId && props.currentBatchId !== batchId) {
      setBatchId(props.currentBatchId);
      void refreshBatchAssets(props.currentBatchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅随外部批次切换同步
  }, [props.currentBatchId]);

  async function createPlan() {
    if (!props.selectedSetId) {
      notify.warning("请先选择道具集");
      return;
    }
    if (!props.styleProfileId) {
      notify.warning("请先在风格设置中上传参考图并完成分析");
      return;
    }
    setPlanning(true);
    try {
      const payload = await fetch("/api/assets/masters/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemSetId: props.selectedSetId,
          batchName: `${props.itemSetName ?? "sheet-batch"}-${Date.now()}`,
          globalArtStyle: props.globalArtStyle,
          negativePrompt: props.negativePrompt,
          imageSize: props.imageSize,
          backgroundMode: props.backgroundMode,
          styleProfileId: props.styleProfileId,
          sheetSize,
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "创建色板计划失败");

      setBatchId(payload.data.batchId);
      setTemplates(payload.data.templates ?? []);
      if (payload.data.templates?.[0]?.baseItemName) {
        setActiveBaseItemName(payload.data.templates[0].baseItemName);
      }
      props.onPlanned?.(payload.data.batchId);
      await refreshBatchAssets(payload.data.batchId);
      notify.success("色板计划已创建", `共 ${payload.data.totalBaseItems} 个物品组`);
    } catch (e) {
      notify.error("创建计划失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setPlanning(false);
    }
  }

  async function generateSheet() {
    if (!batchId || !activeBaseItemName) return;
    setSheetGenerating(true);
    try {
      const payload = await fetch("/api/assets/sheets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          baseItemName: activeBaseItemName,
          negativePrompt: props.negativePrompt,
          sheetSize,
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "色板生成失败");

      const nextStatus = payload.data.status === "ready" ? "ready" : "failed";
      setTemplates((prev) =>
        prev.map((t) =>
          t.baseItemName === activeBaseItemName
            ? {
                ...t,
                status: nextStatus,
                sheetImageUrl: payload.data.sheetImageUrl,
                sheetPrompt: payload.data.sheetPrompt,
              }
            : t,
        ),
      );
      notify.success("色板图已生成", activeBaseItemName);
    } catch (e) {
      notify.error("色板生成失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setSheetGenerating(false);
    }
  }

  async function approveSheet() {
    if (!batchId || !activeBaseItemName) return;
    setApproving(true);
    try {
      const payload = await fetch("/api/assets/sheets/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          baseItemName: activeBaseItemName,
          approvedBy: "planner",
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "色板确认失败");
      setTemplates((prev) =>
        prev.map((t) => (t.baseItemName === activeBaseItemName ? { ...t, status: "approved" } : t)),
      );
      notify.success("色板已确认", "可进行切图分配");
    } catch (e) {
      notify.error("色板确认失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setApproving(false);
    }
  }

  async function splitSheet() {
    if (!batchId || !activeBaseItemName) return;
    setSplitting(true);
    try {
      const payload = await fetch("/api/assets/sheets/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          baseItemName: activeBaseItemName,
          imageSize: props.imageSize,
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "切图失败");

      setTemplates((prev) =>
        prev.map((t) => (t.baseItemName === activeBaseItemName ? { ...t, status: "split" } : t)),
      );
      await refreshBatchAssets(batchId);
      notify.success(
        "切图完成",
        `${activeBaseItemName}：已分配 ${payload.data.successCount} 张，跳过 ${payload.data.skippedCount} 格`,
      );
    } catch (e) {
      notify.error("切图失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setSplitting(false);
    }
  }

  function findAsset(item: ItemLike) {
    return (
      batchAssets.find((a) => a.generatedItemId === item.id) ??
      batchAssets.find((a) => a.name === item.name)
    );
  }

  const showVariants =
    activeTemplate && ["ready", "approved", "split", "failed"].includes(activeTemplate.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">色板工作台（2×4 一次出图）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void createPlan()} disabled={planning || !props.selectedSetId}>
            {planning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            创建色板计划
          </Button>
          <Badge variant="outline">批次：{batchId || "未创建"}</Badge>
          <Badge variant="secondary">组数 {templateStats.total}</Badge>
          <Badge variant="secondary">已切图 {templateStats.split}</Badge>
          <Badge variant="outline">色板尺寸 {sheetSize}</Badge>
        </div>

        {!props.styleProfileId ? (
          <p className="text-sm text-amber-700">请先在「风格设置」上传参考图并分析，以绑定风格配置。</p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="max-h-[560px] space-y-2 overflow-y-auto rounded-md border border-border p-3">
            <p className="text-sm font-medium">物品组</p>
            {grouped.map((g) => {
              const t = templates.find((x) => x.baseItemName === g.baseItemName);
              return (
                <button
                  key={g.baseItemName}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-sm border px-2 py-1.5 text-left text-sm ${
                    activeBaseItemName === g.baseItemName ? "border-primary bg-muted/50" : "border-border"
                  }`}
                  onClick={() => setActiveBaseItemName(g.baseItemName)}
                >
                  <span className="truncate">{g.baseItemName}</span>
                  <Badge
                    variant={
                      t?.status === "split" ? "default" : t?.status === "failed" ? "destructive" : "outline"
                    }
                  >
                    {getStatusLabel(t?.status)}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {!activeBaseItemName ? (
              <p className="text-sm text-muted-foreground">请选择左侧物品组</p>
            ) : (
              <>
                <VariantSheetCard
                  title={activeBaseItemName}
                  subtitle={`${groupItems.length} 个颜色变体 · 一次生成 8 格色板`}
                  status={activeTemplate?.status ?? "draft"}
                  sheetImageUrl={activeTemplate?.sheetImageUrl ?? undefined}
                  prompt={activeTemplate?.sheetPrompt ?? undefined}
                  showGridOverlay={Boolean(activeTemplate?.sheetImageUrl)}
                  actions={
                    <>
                      <Button size="sm" onClick={() => void generateSheet()} disabled={!batchId || sheetGenerating}>
                        {sheetGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        生成色板
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void approveSheet()}
                        disabled={!batchId || approving || activeTemplate?.status !== "ready"}
                      >
                        {approving ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        确认色板
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => void splitSheet()}
                        disabled={!batchId || splitting || activeTemplate?.status !== "approved"}
                      >
                        {splitting ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Scissors className="mr-1 h-3 w-3" />
                        )}
                        切图并分配
                      </Button>
                    </>
                  }
                />

                {showVariants ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">切图结果（{groupItems.length}）</p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {groupItems.map((item) => {
                        const asset = findAsset(item);
                        return (
                          <MasterItemCard
                            key={item.id ?? item.name}
                            name={item.name}
                            displayName={item.displayName}
                            role={item.role}
                            category1={item.category1}
                            size={item.size}
                            pattern={item.pattern}
                            color1={item.color1}
                            status={asset?.status ?? "pending"}
                            prompt={asset?.prompt}
                            imageUrl={asset?.imageUrl ?? undefined}
                            error={asset?.error ?? undefined}
                            actions={
                              <span className="text-xs text-muted-foreground">
                                {getPaletteColorLabel(item.color1)}
                                {asset?.imageUrl ? " · 已切图" : " · 待切图"}
                              </span>
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
