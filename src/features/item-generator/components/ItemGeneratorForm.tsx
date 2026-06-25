"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Table2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { parseStoredGenerationConfig } from "@/lib/generatedItemSetPayload";
import { assignSequentialItemIds } from "@/lib/items/assignSequentialItemIds";
import { createDefaultGeneratedItemRow } from "@/lib/items/defaultGeneratedItemRow";
import { STANDARD_COLOR_PALETTE } from "@/lib/items/colorPalette";
import {
  ITEM_GENERATION_CHUNK_SIZE,
  MAX_ITEM_TYPES,
  computeExpectedTotal,
  validateGenerationParams,
} from "@/lib/items/itemGenerationLimits";
import { zh } from "@/lib/i18n/zh";
import { notify } from "@/lib/ui/notify";
import { useItemGeneratorStore } from "@/stores/itemGeneratorStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { GenerateItemsResult } from "@/types/ai";
import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

import { BatchAddItemsDialog } from "./BatchAddItemsDialog";
import { FormField } from "./FormField";
import { GeneratedItemSetHistory } from "./GeneratedItemSetHistory";
import { GeneratedItemsDimensionTable } from "./GeneratedItemsDimensionTable";
import { GeneratedItemsExcelPreviewDialog } from "./GeneratedItemsExcelPreviewDialog";
import { GeneratedItemNamesPreviewTable } from "./GeneratedItemNamesPreviewTable";
import { GeneratedItemsTable } from "./GeneratedItemsTable";
import { useGeneratedItemsFilter } from "../hooks/useGeneratedItemsFilter";

const t = zh.pages.itemGenerator;

type Props = {
  initialHistory: GeneratedItemSetListItem[];
};

function mapLoadedItems(
  items: Array<GenerateItemsResult["items"][number] & { moveSpeed?: number | null; pattern?: string | null }>,
): GenerateItemsResult["items"] {
  return assignSequentialItemIds(
    items.map((item) => ({
      ...item,
      role: item.role ?? "target",
      moveSpeed: item.moveSpeed ?? 3,
      pattern: item.pattern ?? "纯色",
      count: item.count > 0 ? item.count : 9,
    })),
  );
}

export function ItemGeneratorForm({ initialHistory }: Props) {
  const searchParams = useSearchParams();
  const workspaceFromUrl = searchParams.get("workspace");
  const defaultItemSetId = useItemGeneratorStore((s) => s.defaultItemSetId);
  const setDefaultItemSetId = useItemGeneratorStore((s) => s.setDefaultItemSetId);

  const [setName, setSetName] = useState("海洋生物道具集");
  const [description, setDescription] = useState("海里、河里的鱼、虾、贝类等，卡通 3D 风格，适合三消关卡");
  const [itemTypeCount, setItemTypeCount] = useState(12);
  const [colorCount, setColorCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [batchAddOpen, setBatchAddOpen] = useState(false);
  const [excelPreviewOpen, setExcelPreviewOpen] = useState(false);
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null);
  const [excelFileName, setExcelFileName] = useState("export.xlsx");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateItemsResult | null>(null);
  const [history, setHistory] = useState<GeneratedItemSetListItem[]>(initialHistory);
  const [dirty, setDirty] = useState(false);
  const [savedSetId, setSavedSetId] = useState<string | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActive);
  const autoLoadRef = useRef(false);

  const { filteredWithIndex } = useGeneratedItemsFilter(result?.items ?? []);

  const expectedTotal = computeExpectedTotal(itemTypeCount, colorCount);
  const validationError = validateGenerationParams(itemTypeCount, colorCount);
  const colorLabels = useMemo(() => {
    if (colorCount <= 0) return "不展开变体，各物种使用常规主色（color1）";
    return STANDARD_COLOR_PALETTE.slice(0, colorCount).map((c) => c.label).join("、");
  }, [colorCount]);
  const summary = useMemo(() => result?.summary ?? "", [result]);
  const cloneTemplate = filteredWithIndex[0]?.item ?? null;

  const exportBody = useMemo(() => {
    if (!result) return null;
    return {
      name: setName,
      description,
      itemTypeCount,
      colorCount,
      summary: result.summary,
      warnings: result.warnings,
      items: result.items,
    };
  }, [result, setName, description, itemTypeCount, colorCount]);

  async function loadHistory() {
    const response = await fetch("/api/generated-item-sets");
    const payload = await response.json();
    if (payload.success) {
      setHistory(payload.data);
    }
  }

  const onOpenHistory = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/generated-item-sets/${id}`);
      const payload = await response.json();
      if (!payload.success) {
        notify.error("打开失败", payload.error);
        return;
      }
      const set = payload.data;
      const cfg = parseStoredGenerationConfig(set.constraints);
      setSavedSetId(set.id);
      setActiveWorkspace(set.id, set.name);
      setSetName(set.name);
      setDescription(set.theme ?? set.prompt ?? "");
      setItemTypeCount(cfg.itemTypeCount);
      setColorCount(cfg.colorCount);
      setResult({
        summary: set.summary ?? "",
        warnings: set.warnings ?? [],
        items: mapLoadedItems(set.items),
      });
      setDirty(false);
      setAutoLoaded(true);
    },
    [setActiveWorkspace],
  );

  useEffect(() => {
    if (autoLoadRef.current || result) return;
    const targetId = workspaceFromUrl ?? defaultItemSetId;
    if (!targetId) return;
    autoLoadRef.current = true;
    void onOpenHistory(targetId);
  }, [workspaceFromUrl, defaultItemSetId, onOpenHistory, result]);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    const loadingToast = notify.loading("正在生成道具表，请稍候…");
    try {
      const data =
        itemTypeCount <= ITEM_GENERATION_CHUNK_SIZE
          ? await generateInSingleRequest()
          : await generateInClientBatches(loadingToast);
      setResult(data);
      setDirty(false);
      setSavedSetId(null);
      notify.success("道具表已生成", "记得点击「保存」绑定为当前工作区，便于后续出图与关卡设计。");
    } catch (e) {
      const message = e instanceof Error ? e.message : "生成失败";
      setError(message);
      notify.error("道具表生成失败", message);
    } finally {
      notify.dismiss(loadingToast);
      setLoading(false);
    }
  }

  /** 解析响应：函数超时/崩溃时平台返回非 JSON 文本，避免被吞成 “Unexpected token” */
  async function parseJsonResponse(response: Response) {
    const raw = await response.text();
    let payload: { success?: boolean; error?: string; data?: unknown };
    try {
      payload = JSON.parse(raw);
    } catch {
      const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 200);
      if (response.status === 504 || /timeout/i.test(snippet)) {
        throw new Error(`请求超时（服务器 ${response.status}）：本批耗时过长，请稍后重试。原始信息：${snippet}`);
      }
      throw new Error(`服务器返回异常（${response.status}）：${snippet || "无响应内容"}`);
    }
    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? `请求失败（${response.status}）`);
    }
    return payload.data;
  }

  async function generateInSingleRequest(): Promise<GenerateItemsResult> {
    const response = await fetch("/api/ai/items/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setName, description, itemTypeCount, colorCount }),
    });
    return (await parseJsonResponse(response)) as GenerateItemsResult;
  }

  /** 大种类数：前端编排逐批调用，规避单请求超时，并展示进度 */
  async function generateInClientBatches(toastId: string | number): Promise<GenerateItemsResult> {
    const batchTotal = Math.ceil(itemTypeCount / ITEM_GENERATION_CHUNK_SIZE);
    const stripColor = (name: string) =>
      name.replace(/_(red|orange|yellow|green|blue|purple|pink|gray)$/i, "");

    const mergedItems: GenerateItemsResult["items"] = [];
    const existingNames: string[] = [];
    const warnings: string[] = [
      `物品种类数 ${itemTypeCount} 较多，已分 ${batchTotal} 批生成（每批约 ${ITEM_GENERATION_CHUNK_SIZE} 种）`,
    ];
    let summary = "";

    for (let batchIndex = 0; batchIndex < batchTotal; batchIndex += 1) {
      notify.loading(`正在生成第 ${batchIndex + 1}/${batchTotal} 批，请稍候…（已得 ${mergedItems.length} 种）`, toastId);
      const remaining = itemTypeCount - batchIndex * ITEM_GENERATION_CHUNK_SIZE;
      const chunkTypeCount = Math.min(ITEM_GENERATION_CHUNK_SIZE, remaining);

      const response = await fetch("/api/ai/items/generate-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setName,
          description,
          colorCount,
          chunkTypeCount,
          batchIndex,
          batchTotal,
          existingNames: existingNames.slice(-200),
        }),
      });
      const chunk = (await parseJsonResponse(response)) as GenerateItemsResult;
      if (!summary && chunk.summary) summary = chunk.summary;
      if (Array.isArray(chunk.warnings)) warnings.push(...chunk.warnings);

      for (const item of chunk.items) {
        const slug = stripColor(item.name);
        if (existingNames.includes(slug)) continue;
        existingNames.push(slug);
        mergedItems.push(item);
      }
    }

    notify.loading(`正在整理与编号 ${mergedItems.length} 种物品…`, toastId);
    const finalizeResponse = await fetch("/api/ai/items/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemTypeCount, colorCount, summary, warnings, items: mergedItems }),
    });
    return (await parseJsonResponse(finalizeResponse)) as GenerateItemsResult;
  }

  async function onSave() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: setName,
        description,
        itemTypeCount,
        colorCount,
        summary: result.summary,
        warnings: result.warnings,
        items: result.items,
      };
      const response = await fetch(savedSetId ? `/api/generated-item-sets/${savedSetId}` : "/api/generated-item-sets", {
        method: savedSetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error ?? "保存失败");
      const id = payload.data.id ?? savedSetId;
      setSavedSetId(id);
      if (id) {
        setActiveWorkspace(id, setName);
      }
      setDirty(false);
      await loadHistory();
      notify.success("道具集已保存", "已设为当前工作区，可前往资源工作室出图。");
    } catch (e) {
      const message = e instanceof Error ? e.message : "保存失败";
      setError(message);
      notify.error("保存失败", message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteHistory(id: string) {
    await fetch(`/api/generated-item-sets/${id}`, { method: "DELETE" });
    await loadHistory();
    if (savedSetId === id) {
      setSavedSetId(null);
    }
    if (defaultItemSetId === id) {
      setDefaultItemSetId(null);
    }
  }

  function handleSetDefault(id: string) {
    setDefaultItemSetId(id);
    notify.success("已设为默认道具集", "下次打开道具表生成将自动载入预览。");
  }

  async function fetchExportBlob(): Promise<Blob> {
    if (!exportBody) throw new Error("无数据可导出");
    const response = await fetch("/api/generated-item-sets/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exportBody),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      let message = "导出失败";
      if (contentType.includes("application/json")) {
        const payload = (await response.json()) as { error?: string };
        message = payload.error ?? message;
      }
      throw new Error(message);
    }
    if (!contentType.includes("spreadsheet") && !contentType.includes("octet-stream")) {
      throw new Error("导出响应格式异常，请稍后重试");
    }
    return response.blob();
  }

  async function onExport() {
    if (!result) return;
    setExporting(true);
    setError(null);
    try {
      const blob = await fetchExportBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `generated_item_set_${setName.replace(/[^\w\u4e00-\u9fa5-]/g, "_")}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      notify.success("Excel 已开始下载");
    } catch (e) {
      const message = e instanceof Error ? e.message : "导出失败";
      setError(message);
      notify.error("导出失败", message);
    } finally {
      setExporting(false);
    }
  }

  async function onPreviewExcel() {
    if (!result) return;
    setPreviewing(true);
    setError(null);
    try {
      const blob = await fetchExportBlob();
      setExcelBlob(blob);
      setExcelFileName(`generated_item_set_${setName.replace(/[^\w\u4e00-\u9fa5-]/g, "_")}.xlsx`);
      setExcelPreviewOpen(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "预览失败";
      setError(message);
      notify.error("Excel 预览失败", message);
    } finally {
      setPreviewing(false);
    }
  }

  async function onCopyJson() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    notify.success("已复制 JSON");
  }

  function updateItems(items: GenerateItemsResult["items"]) {
    if (!result) return;
    setResult({ ...result, items });
    setDirty(true);
  }

  function onAddRow() {
    if (!result) return;
    const nextIndex = result.items.length + 1;
    updateItems([...result.items, createDefaultGeneratedItemRow(nextIndex)]);
    notify.success("已添加一行");
  }

  function onBatchAdd(options: {
    count: number;
    mode: "blank" | "clone";
    defaults: { category1: string; shape: string; size: string; pattern: string };
  }) {
    if (!result) return;
    const base = result.items.length;
    const rows: GenerateItemsResult["items"] = [];
    for (let i = 0; i < options.count; i += 1) {
      if (options.mode === "clone" && cloneTemplate) {
        rows.push({
          ...cloneTemplate,
          name: `${cloneTemplate.name}_copy_${base + i + 1}`,
          displayName: `${cloneTemplate.displayName ?? cloneTemplate.name} ${base + i + 1}`,
          isNew: true,
        });
      } else {
        const row = createDefaultGeneratedItemRow(base + i + 1);
        rows.push({
          ...row,
          category1: options.defaults.category1,
          shape: options.defaults.shape,
          size: options.defaults.size,
          pattern: options.defaults.pattern,
        });
      }
    }
    updateItems(assignSequentialItemIds([...result.items, ...rows]));
    notify.success(`已批量添加 ${options.count} 行`);
  }

  const previewActions = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={onAddRow}>
        {t.actions.addRow}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setBatchAddOpen(true)}>
        {t.actions.batchAdd}
      </Button>
      <Button size="sm" onClick={() => void onSave()} disabled={!result || saving}>
        {saving ? t.actions.saving : t.actions.save}
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onPreviewExcel()} disabled={!result || previewing}>
        {previewing ? "加载中…" : t.actions.previewExcel}
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onExport()} disabled={!result || exporting}>
        {exporting ? "导出中…" : t.actions.export}
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onCopyJson()} disabled={!result}>
        {t.actions.copyJson}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start">
        <Card className="xl:sticky xl:top-4">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-lg">{t.configTitle}</CardTitle>
            <CardDescription>{t.configDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <FormField label={t.fields.setName.label} hint={t.fields.setName.hint}>
              <Input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="例如：海洋生物道具集" />
            </FormField>

            <FormField label={t.fields.description.label} hint={t.fields.description.hint}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24"
                placeholder="描述主题、风格、物种范围…"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.fields.itemTypeCount.label} hint={t.fields.itemTypeCount.hint}>
                <Input
                  type="number"
                  min={1}
                  max={MAX_ITEM_TYPES}
                  value={itemTypeCount}
                  onChange={(e) => setItemTypeCount(Number(e.target.value))}
                />
              </FormField>
              <FormField label={t.fields.colorCount.label} hint={t.fields.colorCount.hint}>
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={colorCount}
                  onChange={(e) => setColorCount(Number(e.target.value))}
                />
              </FormField>
            </div>

            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <p>
                预计生成 <span className="font-medium text-foreground">{expectedTotal}</span> 条
                {colorCount <= 0 ? (
                  <>（{itemTypeCount} 种，各 1 条常规色）</>
                ) : (
                  <>（{itemTypeCount} 种 × {colorCount} 色）</>
                )}
              </p>
              <p className="mt-1">{colorCount <= 0 ? "颜色策略" : "颜色"}：{colorLabels}</p>
              {itemTypeCount > 60 ? (
                <p className="mt-1 text-amber-700">种类数较多时将自动分批调用 AI 生成</p>
              ) : null}
            </div>

            <Button className="w-full" onClick={() => void onGenerate()} disabled={loading || Boolean(validationError)}>
              {loading ? t.actions.generating : t.actions.generate}
            </Button>
            {validationError ? (
              <p className="text-xs text-destructive">{validationError}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="min-h-[520px] min-w-0">
          <CardHeader className="flex flex-col gap-3 border-b border-border bg-muted/30 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">{t.previewTitle}</CardTitle>
              {result ? (
                <CardDescription className="mt-1 space-y-1">
                  <span>
                    共 {result.items.length} 条
                    {colorCount <= 0 ? (
                      <> · {itemTypeCount} 种（常规主色）</>
                    ) : (
                      <> · 约 {itemTypeCount} 种 × {colorCount} 色</>
                    )}
                  </span>
                  {autoLoaded && defaultItemSetId === savedSetId ? (
                    <span className="block text-xs text-muted-foreground">已载入默认道具集</span>
                  ) : null}
                  {summary ? <span className="block text-foreground/80">{summary}</span> : null}
                  {dirty ? (
                    <Badge variant="secondary" className="mt-1">
                      {t.dirty}
                    </Badge>
                  ) : null}
                </CardDescription>
              ) : (
                <CardDescription className="mt-1">{t.previewEmptyDesc}</CardDescription>
              )}
            </div>
            {result ? previewActions : null}
          </CardHeader>
          <CardContent className="pt-4">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>请求失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {result ? (
              <div className="space-y-4">
                {result.warnings.length > 0 ? (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    <AlertTitle>{t.warnings}</AlertTitle>
                    <AlertDescription>{result.warnings.join("；")}</AlertDescription>
                  </Alert>
                ) : null}
                <Tabs defaultValue="items">
                  <TabsList>
                    <TabsTrigger value="items">{t.previewTabItems}</TabsTrigger>
                    <TabsTrigger value="dimension">{t.previewTabDimension}</TabsTrigger>
                    <TabsTrigger value="names">{t.previewTabNames}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="items" className="mt-4">
                    <GeneratedItemsTable items={result.items} onChange={updateItems} />
                  </TabsContent>
                  <TabsContent value="dimension" className="mt-4">
                    <GeneratedItemsDimensionTable items={result.items} />
                  </TabsContent>
                  <TabsContent value="names" className="mt-4">
                    <GeneratedItemNamesPreviewTable items={result.items} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <EmptyState
                icon={Table2}
                title={t.previewEmptyTitle}
                description={t.previewEmptyDesc}
                action={
                  <Button onClick={() => void onGenerate()} disabled={loading || Boolean(validationError)}>
                    {loading ? t.actions.generating : t.actions.generate}
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <GeneratedItemSetHistory
        data={history}
        defaultId={defaultItemSetId}
        onOpen={(id) => void onOpenHistory(id)}
        onDelete={(id) => void onDeleteHistory(id)}
        onSetDefault={handleSetDefault}
      />

      <BatchAddItemsDialog
        open={batchAddOpen}
        onOpenChange={setBatchAddOpen}
        cloneTemplate={cloneTemplate}
        onConfirm={onBatchAdd}
      />

      <GeneratedItemsExcelPreviewDialog
        open={excelPreviewOpen}
        onOpenChange={setExcelPreviewOpen}
        blob={excelBlob}
        fileName={excelFileName}
      />
    </div>
  );
}
