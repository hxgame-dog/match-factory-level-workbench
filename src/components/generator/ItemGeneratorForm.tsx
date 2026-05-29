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
import { STANDARD_COLOR_PALETTE } from "@/lib/items/colorPalette";
import { zh } from "@/lib/i18n/zh";
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateItemsResult | null>(null);
  const [history, setHistory] = useState<GeneratedItemSetListItem[]>(initialHistory);
  const [dirty, setDirty] = useState(false);
  const [savedSetId, setSavedSetId] = useState<string | null>(null);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
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
      setSavedSetId(payload.data.id ?? savedSetId);
      setDirty(false);
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
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
    setSetName(set.name);
    setDescription(set.theme ?? set.prompt ?? "");
    setItemTypeCount(cfg.itemTypeCount);
    setColorCount(cfg.colorCount);
    setResult({
      summary: set.summary ?? "",
      warnings: set.warnings ?? [],
      items: set.items,
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
    if (!savedSetId) {
      setError("请先保存道具集，再导出 Excel");
      return;
    }
    const response = await fetch(`/api/generated-item-sets/${savedSetId}/export`, { method: "POST" });
    if (!response.ok) {
      setError("导出失败");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "generated_item_set.xlsx";
    link.click();
    URL.revokeObjectURL(url);
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
      <Button size="sm" variant="outline" onClick={onExport} disabled={!savedSetId}>
        {t.actions.export}
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
      <div className="grid gap-4 lg:grid-cols-[minmax(300px,360px)_1fr] lg:items-start">
        <Card className="lg:sticky lg:top-4">
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

        <Card className="min-h-[520px]">
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
