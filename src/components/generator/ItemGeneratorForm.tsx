"use client";

import { useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { GenerateItemsResult } from "@/types/ai";
import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

import { GeneratedItemSetHistory } from "./GeneratedItemSetHistory";
import { GeneratedItemsTable } from "./GeneratedItemsTable";

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
      setError("请先保存 Item Set，再导出 Excel");
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">输入配置区</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="道具集名称" />
            <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="主题" />
            <Input type="number" value={totalItemCount} onChange={(e) => setTotalItemCount(Number(e.target.value))} placeholder="道具总数" />
            <Input type="number" value={targetTypeCount} onChange={(e) => setTargetTypeCount(Number(e.target.value))} placeholder="目标类型数" />
            <Input type="number" value={targetCountEach} onChange={(e) => setTargetCountEach(Number(e.target.value))} placeholder="每类目标数量" />
            <Input type="number" value={distractorTypeCount} onChange={(e) => setDistractorTypeCount(Number(e.target.value))} placeholder="干扰类型数" />
          </div>
          <Select value={difficultyIntent} onValueChange={(v) => setDifficultyIntent((v ?? "normal") as "easy" | "normal" | "hard" | "expert")}>
            <SelectTrigger><SelectValue placeholder="难度意图" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">easy</SelectItem>
              <SelectItem value="normal">normal</SelectItem>
              <SelectItem value="hard">hard</SelectItem>
              <SelectItem value="expert">expert</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Constraints" />
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={useExistingCatalogOnly} onCheckedChange={(v) => setUseExistingCatalogOnly(Boolean(v))} />
            <span>Use Existing Catalog Only</span>
          </div>
          <Button onClick={onGenerate} disabled={loading}>
            {loading ? "生成中..." : "Generate"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader><CardTitle className="text-lg">Catalog Context</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
          <p>总道具数量: {catalogContext.total}</p>
          <p>最近导入时间: {catalogContext.lastImportedAt ? new Date(catalogContext.lastImportedAt).toLocaleString() : "未知"}</p>
          <p>Category1 分布: {catalogContext.categories.slice(0, 6).map((x) => `${x.name}(${x.count})`).join("、") || "-"}</p>
          <p>Color1 分布: {catalogContext.colors.slice(0, 6).map((x) => `${x.name}(${x.count})`).join("、") || "-"}</p>
          <p>Size 分布: {catalogContext.sizes.slice(0, 6).map((x) => `${x.name}(${x.count})`).join("、") || "-"}</p>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>请求失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">生成结果区</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-700">{summary}</p>
              {dirty ? <Badge variant="secondary">已修改未保存</Badge> : null}
            </div>
            {result.warnings.length > 0 ? (
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
                <AlertTitle>Warnings</AlertTitle>
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
          </CardContent>
        </Card>
      ) : null}

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader><CardTitle className="text-lg">操作区</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={!result || saving}>
            {saving ? "保存中..." : "Save Item Set"}
          </Button>
          <Button variant="outline" onClick={onExport} disabled={!result}>
            Export Excel
          </Button>
          <Button variant="outline" onClick={onGenerate} disabled={loading}>
            Regenerate
          </Button>
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
          <Button variant="outline" onClick={onCopyJson} disabled={!result}>
            Copy JSON
          </Button>
        </CardContent>
      </Card>

      <GeneratedItemSetHistory data={history} onOpen={onOpenHistory} onDelete={onDeleteHistory} />
    </div>
  );
}
