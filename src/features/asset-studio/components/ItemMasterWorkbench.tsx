"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemBaseName } from "@/lib/items/itemName";
import { notify } from "@/lib/ui/notify";

type ItemLike = {
  id?: string;
  name: string;
  displayName?: string;
  color1?: string;
  color2?: string;
  shape?: string;
  size?: string;
  pattern?: string;
};

type MasterTemplate = {
  id: string;
  baseItemName: string;
  status: "draft" | "generating" | "ready" | "approved" | "failed";
  anchorGeneratedItemId?: string;
  masterImageUrl?: string;
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
};

export function ItemMasterWorkbench(props: Props) {
  const [batchId, setBatchId] = useState<string>("");
  const [templates, setTemplates] = useState<MasterTemplate[]>([]);
  const [activeBaseItemName, setActiveBaseItemName] = useState<string>("");
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
      if (payload.data.templates?.[0]?.baseItemName) {
        setActiveBaseItemName(payload.data.templates[0].baseItemName);
      }
      props.onPlanned?.(payload.data.batchId);
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
      setTemplates((prev) =>
        prev.map((t) => (t.baseItemName === activeBaseItemName ? { ...t, status: "ready" } : t)),
      );
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
      notify.success("母版已确认", "可解锁该组颜色变体批量生成");
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
      notify.success("变体批量生成完成", `${activeBaseItemName} 成功 ${payload.data.successCount}`);
    } catch (e) {
      notify.error("变体生成失败", e instanceof Error ? e.message : "请稍后重试");
    } finally {
      setVariantGenerating(false);
    }
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
            1) 创建母版计划
          </Button>
          <Badge variant="outline">batch: {batchId || "未创建"}</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">物品组</p>
            {grouped.map((g) => {
              const t = templates.find((x) => x.baseItemName === g.baseItemName);
              return (
                <button
                  key={g.baseItemName}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-sm border px-2 py-1 text-left text-sm ${
                    activeBaseItemName === g.baseItemName ? "border-primary" : "border-border"
                  }`}
                  onClick={() => setActiveBaseItemName(g.baseItemName)}
                >
                  <span className="truncate">{g.baseItemName}</span>
                  <Badge variant={t?.status === "approved" ? "default" : "outline"}>
                    {t?.status ?? "draft"}
                  </Badge>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 rounded-md border border-border p-3">
            <p className="text-sm font-medium">当前母版：{activeBaseItemName || "未选择"}</p>
            <div className="text-xs text-muted-foreground">
              锚点和变体来自同一物品名分组；必须先确认母版才能批量生成变体。
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-sm border border-border p-2 text-xs">
                <p>变体数量：{activeGroup?.items.length ?? 0}</p>
                <p>母版状态：{activeTemplate?.status ?? "draft"}</p>
              </div>
              <div className="rounded-sm border border-border p-2 text-xs">
                <p>shape: {activeTemplate?.shape ?? "-"}</p>
                <p>size: {activeTemplate?.size ?? "-"}</p>
                <p>pattern: {activeTemplate?.pattern ?? "-"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void generateMaster()} disabled={!batchId || !activeBaseItemName || masterGenerating}>
                {masterGenerating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                2) 生成母版
              </Button>
              <Button
                variant="outline"
                onClick={() => void approveMaster()}
                disabled={!batchId || !activeBaseItemName || approving || activeTemplate?.status !== "ready"}
              >
                {approving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                3) 确认母版
              </Button>
              <Button
                variant="outline"
                onClick={() => void generateVariants()}
                disabled={!batchId || !activeBaseItemName || variantGenerating || activeTemplate?.status !== "approved"}
              >
                {variantGenerating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                4) 批量生成变体
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

