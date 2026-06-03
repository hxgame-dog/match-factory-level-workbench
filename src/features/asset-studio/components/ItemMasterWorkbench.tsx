"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemBaseName } from "@/lib/items/itemName";
import { notify } from "@/lib/ui/notify";

import { MasterItemCard } from "./MasterItemCard";

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
  isMaster?: boolean;
  generatedItemId?: string | null;
};

type MasterTemplate = {
  id: string;
  baseItemName: string;
  status: "draft" | "generating" | "ready" | "approved" | "failed";
  anchorGeneratedItemId?: string;
  masterImageUrl?: string;
  masterPrompt?: string;
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
  onPlanned?: (batchId: string) => void;
  onBatchAssetsUpdated?: (assets: BatchAsset[]) => void;
};

export function ItemMasterWorkbench(props: Props) {
  const [batchId, setBatchId] = useState<string>("");
  const [templates, setTemplates] = useState<MasterTemplate[]>([]);
  const [batchAssets, setBatchAssets] = useState<BatchAsset[]>([]);
  const [activeBaseItemName, setActiveBaseItemName] = useState<string>("");
  const [variantsExpanded, setVariantsExpanded] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [masterGenerating, setMasterGenerating] = useState(false);
  const [variantGenerating, setVariantGenerating] = useState(false);
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

  const anchorItem = useMemo(() => {
    if (!activeGroup) return undefined;
    if (activeTemplate?.anchorGeneratedItemId) {
      return activeGroup.items.find((i) => i.id === activeTemplate.anchorGeneratedItemId) ?? activeGroup.items[0];
    }
    return activeGroup.items[0];
  }, [activeGroup, activeTemplate?.anchorGeneratedItemId]);

  const masterAsset = useMemo(() => {
    if (!anchorItem) return undefined;
    return (
      batchAssets.find((a) => a.generatedItemId === anchorItem.id) ??
      batchAssets.find((a) => a.name === anchorItem.name && a.isMaster) ??
      batchAssets.find((a) => a.name === anchorItem.name)
    );
  }, [batchAssets, anchorItem]);

  const variantItems = useMemo(() => {
    if (!activeGroup || !anchorItem) return [];
    return activeGroup.items.filter((i) => i.name !== anchorItem.name);
  }, [activeGroup, anchorItem]);

  const templateStats = useMemo(() => {
    const total = templates.length;
    const approved = templates.filter((t) => t.status === "approved").length;
    const ready = templates.filter((t) => t.status === "ready").length;
    const failed = templates.filter((t) => t.status === "failed").length;
    return { total, approved, ready, failed };
  }, [templates]);

  const showVariantsPanel =
    variantsExpanded &&
    Boolean(activeTemplate && ["ready", "approved", "failed"].includes(activeTemplate.status));

  function getStatusLabel(status?: MasterTemplate["status"]) {
    switch (status) {
      case "approved":
        return "已通过";
      case "ready":
        return "待确认";
      case "generating":
        return "生成中";
      case "failed":
        return "失败";
      case "draft":
      default:
        return "草稿";
    }
  }

  async function refreshBatchAssets(id: string) {
    const payload = await fetch(`/api/assets/batches/${id}`).then((r) => r.json());
    if (!payload.success) return;
    const assets = payload.data.assets as BatchAsset[];
    setBatchAssets(assets);
    props.onBatchAssetsUpdated?.(assets);
  }

  async function createPlan() {
    if (!props.selectedSetId) {
      notify.warning("请先选择道具集");
      return;
    }
    setPlanning(true);
    try {
      const payload = await fetch("/api/assets/masters/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemSetId: props.selectedSetId,
          batchName: `${props.itemSetName ?? "master-batch"}-${Date.now()}`,
          globalArtStyle: props.globalArtStyle,
          negativePrompt: props.negativePrompt,
          imageSize: props.imageSize,
          backgroundMode: props.backgroundMode,
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "创建母版计划失败");

      setBatchId(payload.data.batchId);
      setTemplates(payload.data.templates);
      setVariantsExpanded(false);
      if (payload.data.templates?.[0]?.baseItemName) {
        setActiveBaseItemName(payload.data.templates[0].baseItemName);
      }
      props.onPlanned?.(payload.data.batchId);
      await refreshBatchAssets(payload.data.batchId);
      notify.success("母版计划已创建", `共 ${payload.data.totalBaseItems} 个物品组`);
    } catch (e) {
      notify.error("创建母版计划失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setPlanning(false);
    }
  }

  async function generateMaster() {
    if (!batchId || !activeBaseItemName) return;
    setMasterGenerating(true);
    try {
      const payload = await fetch("/api/assets/masters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          baseItemName: activeBaseItemName,
          negativePrompt: props.negativePrompt,
          imageSize: props.imageSize,
          backgroundMode: props.backgroundMode,
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "母版生成失败");

      const nextStatus = payload.data.status === "done" ? "ready" : "failed";
      setTemplates((prev) =>
        prev.map((t) =>
          t.baseItemName === activeBaseItemName
            ? {
                ...t,
                status: nextStatus,
                masterImageUrl: payload.data.masterImageUrl,
                masterPrompt: payload.data.masterPrompt,
              }
            : t,
        ),
      );
      setVariantsExpanded(nextStatus === "ready" || nextStatus === "failed");
      await refreshBatchAssets(batchId);
      notify.success("母版生成完成", activeBaseItemName);
    } catch (e) {
      notify.error("母版生成失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setMasterGenerating(false);
    }
  }

  async function approveMaster() {
    if (!batchId || !activeBaseItemName) return;
    setApproving(true);
    try {
      const payload = await fetch("/api/assets/masters/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          baseItemName: activeBaseItemName,
          approvedBy: "planner",
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "母版确认失败");
      setTemplates((prev) =>
        prev.map((t) => (t.baseItemName === activeBaseItemName ? { ...t, status: "approved" } : t)),
      );
      notify.success("母版已确认", "可批量生成颜色变体");
    } catch (e) {
      notify.error("母版确认失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setApproving(false);
    }
  }

  async function generateVariants() {
    if (!batchId || !activeBaseItemName) return;
    setVariantGenerating(true);
    try {
      const payload = await fetch("/api/assets/masters/variants/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          baseItemName: activeBaseItemName,
          negativePrompt: props.negativePrompt,
          imageSize: props.imageSize,
          backgroundMode: props.backgroundMode,
        }),
      }).then((r) => r.json());
      if (!payload.success) throw new Error(payload.error ?? "变体生成失败");
      await refreshBatchAssets(batchId);
      notify.success("变体批量生成完成", `${activeBaseItemName} 成功 ${payload.data.successCount}`);
    } catch (e) {
      notify.error("变体生成失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setVariantGenerating(false);
    }
  }

  function findVariantAsset(item: ItemLike) {
    return batchAssets.find((a) => a.generatedItemId === item.id) ?? batchAssets.find((a) => a.name === item.name);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">母版工作台（按物品名）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void createPlan()} disabled={planning || !props.selectedSetId}>
            {planning ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            创建母版计划
          </Button>
          <Badge variant="outline">批次：{batchId || "未创建"}</Badge>
          <Badge variant="secondary">总组数 {templateStats.total}</Badge>
          <Badge variant="secondary">已通过 {templateStats.approved}</Badge>
          <Badge variant="secondary">待确认 {templateStats.ready}</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-md border border-border p-3">
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
                  onClick={() => {
                    setActiveBaseItemName(g.baseItemName);
                    setVariantsExpanded(Boolean(t && ["ready", "approved", "failed"].includes(t.status)));
                  }}
                >
                  <span className="truncate">{g.baseItemName}</span>
                  <Badge variant={t?.status === "approved" ? "default" : t?.status === "failed" ? "destructive" : "outline"}>
                    {getStatusLabel(t?.status)}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {!anchorItem ? (
              <p className="text-sm text-muted-foreground">请选择左侧物品组</p>
            ) : (
              <>
                <div className="max-w-sm">
                  <MasterItemCard
                    isMaster
                    name={anchorItem.name}
                    displayName={anchorItem.displayName}
                    role={anchorItem.role}
                    category1={anchorItem.category1}
                    size={anchorItem.size}
                    pattern={anchorItem.pattern ?? activeTemplate?.pattern}
                    color1={anchorItem.color1}
                    status={masterAsset?.status ?? activeTemplate?.status ?? "pending"}
                    prompt={masterAsset?.prompt ?? activeTemplate?.masterPrompt}
                    imageUrl={masterAsset?.imageUrl ?? activeTemplate?.masterImageUrl ?? undefined}
                    error={masterAsset?.error ?? undefined}
                    actions={
                      <>
                        <Button size="sm" onClick={() => void generateMaster()} disabled={!batchId || masterGenerating}>
                          {masterGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                          生成母版
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void approveMaster()}
                          disabled={!batchId || approving || activeTemplate?.status !== "ready"}
                        >
                          {approving ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          )}
                          确认母版
                        </Button>
                      </>
                    }
                  />
                </div>

                {activeTemplate && ["ready", "approved", "failed"].includes(activeTemplate.status) ? (
                  <div className="rounded-md border border-border">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium"
                      onClick={() => setVariantsExpanded((v) => !v)}
                    >
                      {showVariantsPanel ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      颜色变体（{variantItems.length}）
                      {activeTemplate.status === "approved" ? (
                        <Badge variant="default" className="ml-1">
                          已解锁批量
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-1">
                          需先确认母版
                        </Badge>
                      )}
                    </button>
                    {showVariantsPanel ? (
                      <div className="space-y-3 border-t border-border p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => void generateVariants()}
                            disabled={
                              !batchId || variantGenerating || activeTemplate.status !== "approved"
                            }
                          >
                            {variantGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                            批量生成变体
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {variantItems.map((item) => {
                            const asset = findVariantAsset(item);
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
                                    {asset?.imageUrl ? "已生成" : "待生成"}
                                  </span>
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
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
