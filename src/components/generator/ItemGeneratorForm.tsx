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
  const [itemCount, setItemCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateItemsResult | null>(null);
  const [history, setHistory] = useState<GeneratedItemSetListItem[]>(initialHistory);
  const [dirty, setDirty] = useState(false);
  const [savedSetId, setSavedSetId] = useState<string | null>(null);

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
          itemCount,
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
        itemCount,
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
    setSavedSetId(set.id);
    setSetName(set.name);
    setDescription(set.theme ?? set.prompt ?? "");
    setItemCount(set.totalItemCount || set.items?.length || 12);
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
      <Card>
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
              placeholder="描述你想要的道具主题、风格、物种范围…"
            />
          </FormField>

          <FormField label={t.fields.itemCount.label} hint={t.fields.itemCount.hint}>
            <Input
              type="number"
              min={1}
              max={80}
              value={itemCount}
              onChange={(e) => setItemCount(Number(e.target.value))}
            />
          </FormField>

          <Button className="w-full sm:w-auto" onClick={() => void onGenerate()} disabled={loading}>
            {loading ? t.actions.generating : t.actions.generate}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>请求失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">{t.previewTitle}</CardTitle>
            {result ? (
              <CardDescription className="mt-1">
                共 {result.items.length} 种
                {summary ? ` · ${summary}` : ""}
                {dirty ? (
                  <Badge variant="secondary" className="ml-2">
                    {t.dirty}
                  </Badge>
                ) : null}
              </CardDescription>
            ) : null}
          </div>
          {result ? previewActions : null}
        </CardHeader>
        <CardContent className="pt-6">
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
                <Button onClick={() => void onGenerate()} disabled={loading}>
                  {loading ? t.actions.generating : t.actions.generate}
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <GeneratedItemSetHistory data={history} onOpen={onOpenHistory} onDelete={onDeleteHistory} />
    </div>
  );
}
