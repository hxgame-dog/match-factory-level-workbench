"use client";

import { useMemo, useState } from "react";
import { Table2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseStoredGenerationConfig } from "@/lib/generatedItemSetPayload";
import { assignSequentialItemIds } from "@/lib/items/assignSequentialItemIds";
import { STANDARD_COLOR_PALETTE } from "@/lib/items/colorPalette";
import { zh } from "@/lib/i18n/zh";
import { notify } from "@/lib/ui/notify";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { GenerateItemsResult } from "@/types/ai";
import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

import { FormField } from "./FormField";
import { GeneratedItemSetHistory } from "./GeneratedItemSetHistory";
import { GeneratedItemsTable } from "./GeneratedItemsTable";

const t = zh.pages.itemGenerator;

type Props = {
  initialHistory: GeneratedItemSetListItem[];
};

export function ItemGeneratorForm({ initialHistory }: Props) {
  const [setName, setSetName] = useState("海洋生物道具集");
  const [description, setDescription] = useState("海里、河里的鱼、虾、贝类等，卡通 3D 风格，适合三消关卡");
  const [itemTypeCount, setItemTypeCount] = useState(12);
  const [colorCount, setColorCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateItemsResult | null>(null);
  const [history, setHistory] = useState<GeneratedItemSetListItem[]>(initialHistory);
  const [dirty, setDirty] = useState(false);
  const [savedSetId, setSavedSetId] = useState<string | null>(null);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActive);

  const expectedTotal = itemTypeCount * colorCount;
  const colorLabels = useMemo(
    () => STANDARD_COLOR_PALETTE.slice(0, colorCount).map((c) => c.label).join("、"),
    [colorCount],
  );
  const summary = useMemo(() => result?.summary ?? "", [result]);

  async function loadHistory() {
    const response = await fetch("/api/generated-item-sets");
    const payload = await response.json();
    if (payload.success) {
      setHistory(payload.data);
    }
  }

  async function onGenerate() {
    setLoading(true);
    setError(null);
    const loadingToast = notify.loading("正在生成道具表，请稍候…");
    try {
      const response = await fetch("/api/ai/items/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setName,
          description,
          itemTypeCount,
          colorCount,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "生成失败");
      }
      setResult(payload.data as GenerateItemsResult);
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

  async function onOpenHistory(id: string) {
    const response = await fetch(`/api/generated-item-sets/${id}`);
    const payload = await response.json();
    if (!payload.success) return;
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
      items: assignSequentialItemIds(
        set.items.map(
          (item: GenerateItemsResult["items"][number] & { moveSpeed?: number | null }) => ({
            ...item,
            role: item.role ?? "target",
            moveSpeed: item.moveSpeed ?? 3,
          }),
        ),
      ),
    });
    setDirty(false);
  }

  async function onDeleteHistory(id: string) {
    await fetch(`/api/generated-item-sets/${id}`, { method: "DELETE" });
    await loadHistory();
    if (savedSetId === id) {
      setSavedSetId(null);
    }
  }

  async function onExport() {
    if (!result) return;
    setExporting(true);
    setError(null);
    try {
      const exportBody = {
        name: setName,
        description,
        itemTypeCount,
        colorCount,
        summary: result.summary,
        warnings: result.warnings,
        items: result.items,
      };
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
      const blob = await response.blob();
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

  async function onCopyJson() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  function onClear() {
    setResult(null);
    setError(null);
    setSavedSetId(null);
    setDirty(false);
  }

  const previewActions = (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={onSave} disabled={!result || saving}>
        {saving ? t.actions.saving : t.actions.save}
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onExport()} disabled={!result || exporting}>
        {exporting ? "导出中…" : t.actions.export}
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onGenerate()} disabled={loading}>
        {t.actions.regenerate}
      </Button>
      <Button size="sm" variant="outline" onClick={onClear} disabled={!result}>
        {t.actions.clear}
      </Button>
      <Button size="sm" variant="outline" onClick={onCopyJson} disabled={!result}>
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
                  max={150}
                  value={itemTypeCount}
                  onChange={(e) => setItemTypeCount(Number(e.target.value))}
                />
              </FormField>
              <FormField label={t.fields.colorCount.label} hint={t.fields.colorCount.hint}>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={colorCount}
                  onChange={(e) => setColorCount(Number(e.target.value))}
                />
              </FormField>
            </div>

            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <p>
                预计生成 <span className="font-medium text-foreground">{expectedTotal}</span> 条（{itemTypeCount} 种 ×{" "}
                {colorCount} 色）
              </p>
              <p className="mt-1">颜色：{colorLabels}</p>
            </div>

            <Button className="w-full" onClick={() => void onGenerate()} disabled={loading || expectedTotal > 1000}>
              {loading ? t.actions.generating : t.actions.generate}
            </Button>
            {expectedTotal > 1000 ? (
              <p className="text-xs text-destructive">种类数 × 颜色数不能超过 1000</p>
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
                    共 {result.items.length} 条 · 约 {itemTypeCount} 种 × {colorCount} 色
                  </span>
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
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                    <AlertTitle>{t.warnings}</AlertTitle>
                    <AlertDescription>{result.warnings.join("；")}</AlertDescription>
                  </Alert>
                ) : null}
                <GeneratedItemsTable
                  items={result.items}
                  onChange={(items) => {
                    setResult({ ...result, items });
                    setDirty(true);
                  }}
                />
              </div>
            ) : (
              <EmptyState
                icon={Table2}
                title={t.previewEmptyTitle}
                description={t.previewEmptyDesc}
                action={
                  <Button onClick={() => void onGenerate()} disabled={loading || expectedTotal > 1000}>
                    {loading ? t.actions.generating : t.actions.generate}
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <GeneratedItemSetHistory data={history} onOpen={onOpenHistory} onDelete={onDeleteHistory} />
    </div>
  );
}
