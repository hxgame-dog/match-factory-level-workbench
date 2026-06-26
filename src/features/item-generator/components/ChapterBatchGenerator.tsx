"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ANIMAL_CHAPTER_PLANS,
  buildChapterDescription,
  type ChapterPlan,
} from "@/lib/items/chapterPlans";
import { notify } from "@/lib/ui/notify";
import {
  generateItemTableClient,
  saveGeneratedItemSet,
} from "../lib/generateItemTableClient";

type ChapterStatus = "pending" | "generating" | "saved" | "failed";

type ChapterState = {
  status: ChapterStatus;
  progress: string;
  generatedCount: number;
  savedSetId: string | null;
  warningCount: number;
  error: string | null;
};

const INITIAL_STATE: ChapterState = {
  status: "pending",
  progress: "",
  generatedCount: 0,
  savedSetId: null,
  warningCount: 0,
  error: null,
};

type Props = {
  /** 某章保存成功后回调（用于父级刷新历史、设为工作区） */
  onChapterSaved?: (id: string, name: string) => void;
};

export function ChapterBatchGenerator({ onChapterSaved }: Props) {
  const [states, setStates] = useState<Record<string, ChapterState>>(() =>
    Object.fromEntries(ANIMAL_CHAPTER_PLANS.map((p) => [p.id, { ...INITIAL_STATE }])),
  );
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);

  function patch(id: string, next: Partial<ChapterState>) {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...next } }));
  }

  async function generateChapter(plan: ChapterPlan): Promise<boolean> {
    setRunningId(plan.id);
    patch(plan.id, { status: "generating", progress: "准备中…", error: null });
    const existingId = states[plan.id]?.savedSetId ?? null;
    try {
      const result = await generateItemTableClient(
        {
          setName: plan.setName,
          description: buildChapterDescription(plan),
          itemTypeCount: plan.addedCount,
          colorCount: plan.colorCount,
        },
        (p) => {
          patch(plan.id, {
            progress:
              p.phase === "finalize"
                ? `整理与编号 ${p.collected} 种…`
                : `生成第 ${p.batchIndex + 1}/${p.batchTotal} 批…（已得 ${p.collected} 种）`,
          });
        },
      );

      patch(plan.id, { progress: "保存中…", generatedCount: result.items.length });
      const id = await saveGeneratedItemSet(
        {
          setName: plan.setName,
          description: buildChapterDescription(plan),
          itemTypeCount: plan.addedCount,
          colorCount: plan.colorCount,
          result,
        },
        existingId,
      );

      patch(plan.id, {
        status: "saved",
        progress: "",
        savedSetId: id,
        generatedCount: result.items.length,
        warningCount: result.warnings.length,
        error: null,
      });
      onChapterSaved?.(id, plan.setName);
      notify.success(`「${plan.name}」已生成并保存`, `共 ${result.items.length} 种道具`);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "生成失败";
      patch(plan.id, { status: "failed", progress: "", error: message });
      notify.error(`「${plan.name}」生成失败`, message);
      return false;
    } finally {
      setRunningId(null);
    }
  }

  async function generateAll() {
    setRunningAll(true);
    try {
      for (const plan of ANIMAL_CHAPTER_PLANS) {
        if (states[plan.id]?.status === "saved") continue;
        const ok = await generateChapter(plan);
        if (!ok) {
          notify.warning("已中止后续章节", "请处理失败章节后再继续，或单独重试该章。");
          break;
        }
      }
    } finally {
      setRunningAll(false);
    }
  }

  const busy = runningAll || runningId !== null;
  const savedCount = Object.values(states).filter((s) => s.status === "saved").length;
  const totalAdded = ANIMAL_CHAPTER_PLANS.reduce((sum, p) => sum + p.addedCount, 0);

  return (
    <Card>
      <CardHeader className="border-b border-border bg-muted/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">分章节批量生成（动物主题四章节）</CardTitle>
            <CardDescription>
              逐章单独生成并自动保存为独立道具集，按本章新增数生成、颜色数 0（共 {totalAdded} 种新道具）。
              已完成 {savedCount}/{ANIMAL_CHAPTER_PLANS.length} 章。
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => void generateAll()} disabled={busy}>
            {runningAll ? "正在全部生成…" : "全部生成并保存"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {ANIMAL_CHAPTER_PLANS.map((plan) => {
          const s = states[plan.id] ?? INITIAL_STATE;
          const isRunning = runningId === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {plan.icon} {plan.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{plan.subtitle}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>新增种类</span>
                    <span className="text-foreground">{plan.addedCount} 种 · 颜色数 {plan.colorCount}</span>
                    <span>类别配额</span>
                    <span>{plan.categories.length} 类 · {plan.stages.length} 阶段</span>
                    {s.status === "generating" && (
                      <>
                        <span>进度</span>
                        <span className="text-blue-700">{s.progress || "处理中…"}</span>
                      </>
                    )}
                    {s.status === "saved" && (
                      <>
                        <span>结果</span>
                        <span className="text-foreground">
                          {s.generatedCount} 种已保存
                          {s.warningCount > 0 ? ` · ${s.warningCount} 条提示` : ""}
                          {s.savedSetId && (
                            <Link
                              href={`/item-generator?workspace=${s.savedSetId}`}
                              className="ml-2 text-primary hover:underline"
                            >
                              打开
                            </Link>
                          )}
                        </span>
                      </>
                    )}
                    {s.status === "failed" && s.error && (
                      <>
                        <span>错误</span>
                        <span className="text-destructive">{s.error}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex sm:justify-end">
                  <Button
                    size="sm"
                    variant={s.status === "saved" ? "outline" : "default"}
                    onClick={() => void generateChapter(plan)}
                    disabled={busy}
                  >
                    {isRunning
                      ? "生成中…"
                      : s.status === "saved"
                        ? "重新生成"
                        : s.status === "failed"
                          ? "重试"
                          : "生成并保存"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
