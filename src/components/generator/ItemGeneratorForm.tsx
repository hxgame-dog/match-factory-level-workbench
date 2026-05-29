"use client";

import { useMemo, useState } from "react";
import { Table2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zh } from "@/lib/i18n/zh";
import type { GenerateItemsResult } from "@/types/ai";
import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

import { FormField } from "./FormField";
import { GeneratedItemSetHistory } from "./GeneratedItemSetHistory";
import { GeneratedItemsTable } from "./GeneratedItemsTable";

const t = zh.pages.itemGenerator;

type CatalogContext = {
  total: number;
  categories: Array<{ name: string; count: number }>;
  colors: Array<{ name: string; count: number }>;
  sizes: Array<{ name: string; count: number }>;
  lastImportedAt?: string;
};

type Props = {
  catalogContext: CatalogContext;
  initialHistory: GeneratedItemSetListItem[];
};

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: t.difficulty.easy },
  { value: "normal", label: t.difficulty.normal },
  { value: "hard", label: t.difficulty.hard },
  { value: "expert", label: t.difficulty.expert },
] as const;

export function ItemGeneratorForm({ catalogContext, initialHistory }: Props) {
  const [setName, setSetName] = useState("早餐关卡组合A");
  const [theme, setTheme] = useState("早餐主题");
  const [totalItemCount, setTotalItemCount] = useState(40);
  const [targetTypeCount, setTargetTypeCount] = useState(4);
  const [targetCountEach, setTargetCountEach] = useState(9);
  const [distractorTypeCount, setDistractorTypeCount] = useState(3);
  const [difficultyIntent, setDifficultyIntent] =
    useState<"easy" | "normal" | "hard" | "expert">("normal");
  const [constraints, setConstraints] = useState("");
  const [useExistingCatalogOnly, setUseExistingCatalogOnly] = useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);
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
          theme,
          totalItemCount,
          targetTypeCount,
          targetCountEach,
          distractorTypeCount,
          difficultyIntent,
          constraints,
          setName,
          useExistingCatalogOnly,
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
      const response = await fetch(savedSetId ? `/api/generated-item-sets/${savedSetId}` : "/api/generated-item-sets", {
        method: savedSetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setName,
          theme,
          prompt: theme,
          totalItemCount,
          targetTypeCount,
          targetCountEach,
          distractorTypeCount,
          difficultyIntent,
          constraints,
          useExistingCatalogOnly,
          summary: result.summary,
          warnings: result.warnings,
          items: result.items,
        }),
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
    setTheme(set.theme);
    setTotalItemCount(set.totalItemCount);
    setTargetTypeCount(set.targetTypeCount);
    setTargetCountEach(set.targetCountEach);
    setDistractorTypeCount(set.distractorTypeCount);
    setDifficultyIntent((set.difficultyIntent || "normal") as "easy" | "normal" | "hard" | "expert");
    setConstraints(set.constraints ?? "");
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
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t.fields.setName.label} hint={t.fields.setName.hint}>
              <Input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="例如：早餐关卡组合 A" />
            </FormField>
            <FormField label={t.fields.theme.label} hint={t.fields.theme.hint}>
              <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="例如：早餐、运动器材" />
            </FormField>
            <FormField label={t.fields.totalItemCount.label} hint={t.fields.totalItemCount.hint}>
              <Input
                type="number"
                min={1}
                value={totalItemCount}
                onChange={(e) => setTotalItemCount(Number(e.target.value))}
              />
            </FormField>
            <FormField label={t.fields.targetTypeCount.label} hint={t.fields.targetTypeCount.hint}>
              <Input
                type="number"
                min={1}
                value={targetTypeCount}
                onChange={(e) => setTargetTypeCount(Number(e.target.value))}
              />
            </FormField>
            <FormField label={t.fields.targetCountEach.label} hint={t.fields.targetCountEach.hint}>
              <Input
                type="number"
                min={1}
                value={targetCountEach}
                onChange={(e) => setTargetCountEach(Number(e.target.value))}
              />
            </FormField>
            <FormField label={t.fields.distractorTypeCount.label} hint={t.fields.distractorTypeCount.hint}>
              <Input
                type="number"
                min={0}
                value={distractorTypeCount}
                onChange={(e) => setDistractorTypeCount(Number(e.target.value))}
              />
            </FormField>
            <FormField label={t.fields.difficultyIntent.label} hint={t.fields.difficultyIntent.hint}>
              <Select
                value={difficultyIntent}
                onValueChange={(v) => setDifficultyIntent((v ?? "normal") as typeof difficultyIntent)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label={t.fields.constraints.label} hint={t.fields.constraints.hint}>
            <Textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="例如：避免使用红色道具；目标物以食物为主"
              className="min-h-20"
            />
          </FormField>

          <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-muted/20 px-3 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t.fields.useExistingCatalogOnly.label}</p>
              <p className="text-xs text-muted-foreground">{t.fields.useExistingCatalogOnly.hint}</p>
            </div>
            <Switch checked={useExistingCatalogOnly} onCheckedChange={(v) => setUseExistingCatalogOnly(Boolean(v))} />
          </div>

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
                共 {result.items.length} 条
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

      <Card>
        <CardHeader className="border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">{t.catalogTitle}</CardTitle>
              <CardDescription>{t.catalogDesc}</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCatalogOpen((v) => !v)}>
              {catalogOpen ? zh.common.collapse : zh.common.expand}
            </Button>
          </div>
        </CardHeader>
        {catalogOpen ? (
          <CardContent className="grid gap-2 pt-4 text-sm text-muted-foreground md:grid-cols-2">
            <p>总道具数量：{catalogContext.total}</p>
            <p>
              最近导入：
              {catalogContext.lastImportedAt ? new Date(catalogContext.lastImportedAt).toLocaleString() : "未知"}
            </p>
            <p>一级分类分布：{catalogContext.categories.slice(0, 6).map((x) => `${x.name}(${x.count})`).join("、") || "—"}</p>
            <p>主色分布：{catalogContext.colors.slice(0, 6).map((x) => `${x.name}(${x.count})`).join("、") || "—"}</p>
            <p className="md:col-span-2">尺寸分布：{catalogContext.sizes.slice(0, 6).map((x) => `${x.name}(${x.count})`).join("、") || "—"}</p>
            {catalogContext.total === 0 ? (
              <p className="md:col-span-2 text-amber-800">
                道具库为空，请先在「道具库」页导入 CSV/Excel，否则生成将仅能依赖 Mock 或新建道具。
              </p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <GeneratedItemSetHistory data={history} onOpen={onOpenHistory} onDelete={onDeleteHistory} />
    </div>
  );
}
