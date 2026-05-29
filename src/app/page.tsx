import { getAiStatus } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";
import { AiStatusCard } from "@/components/ai/AiStatusCard";
import { DashboardModuleCard, type DashboardStatLine } from "@/components/dashboard/DashboardModuleCard";
import { WorkflowGuideSection } from "@/components/dashboard/WorkflowGuideSection";
import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";

type ModuleDef = {
  title: string;
  description: string;
  href: string;
  stats: DashboardStatLine[];
};

function formatPercent(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) return "-";
  return `${Math.round(rate * 100)}%`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return date.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const [
    itemCount,
    itemSetCount,
    latestItemSet,
    assetBatchCount,
    latestAssetBatch,
    assetDoneCount,
    levelCount,
    levelDraftCount,
    latestLevel,
    formulaPresetCount,
    diagnosisRunCount,
    latestDiagnosis,
    autoRunCount,
    latestAutoRun,
    packageCount,
    latestPackage,
    exportJobCount,
    importJobCount,
    snapshotCount,
    playtestRunCount,
    latestPlaytest,
    analyticsBatchCount,
    latestAnalyticsBatch,
    optimizationCount,
    recentDiagnoses,
    aiStatus,
    aiLogCount,
  ] = await Promise.all([
    prisma.itemCatalog.count(),
    prisma.generatedItemSet.count(),
    prisma.generatedItemSet.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.assetGenerationBatch.count(),
    prisma.assetGenerationBatch.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.generatedAsset.count({ where: { status: "done" } }),
    prisma.generatedLevel.count(),
    prisma.generatedLevel.count({ where: { status: "draft" } }),
    prisma.generatedLevel.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.formulaPreset.count(),
    prisma.difficultyDiagnosisRun.count(),
    prisma.difficultyDiagnosisRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.autoLevelGenerationRun.count(),
    prisma.autoLevelGenerationRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.productionPackage.count(),
    prisma.productionPackage.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.exportJob.count(),
    prisma.importJob.count(),
    prisma.levelSnapshot.count(),
    prisma.playtestSimulationRun.count(),
    prisma.playtestSimulationRun.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.analyticsImportBatch.count(),
    prisma.analyticsImportBatch.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.levelOptimizationProposal.count(),
    prisma.levelFeedbackDiagnosis.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    getAiStatus(),
    prisma.aiGenerationLog.count(),
  ]);

  const highSeverityFeedbackCount = recentDiagnoses.filter((d) => d.status === "needs_review").length;
  const latestPlaytestSummary = (() => {
    if (!latestPlaytest?.summaryJson) return null;
    try {
      return JSON.parse(latestPlaytest.summaryJson) as { avgPassRate?: number; needsReviewCount?: number };
    } catch {
      return null;
    }
  })();

  const modules: ModuleDef[] = [
    {
      title: "道具库",
      description: "导入、筛选与管理基础道具目录",
      href: "/items",
      stats: [
        { label: "道具总数", value: String(itemCount) },
        { label: "最近更新", value: itemCount > 0 ? "已就绪" : "待导入" },
      ],
    },
    {
      title: "AI 实验室",
      description: "检测 Gemini 连接与 Mock 模式",
      href: "/ai-lab",
      stats: [
        { label: zh.common.provider, value: aiStatus.provider },
        { label: zh.common.mockMode, value: aiStatus.mockMode ? "开启" : "关闭" },
        { label: zh.common.apiKey, value: aiStatus.hasGeminiKey ? "已配置" : "未配置" },
        { label: "AI 调用记录", value: String(aiLogCount) },
      ],
    },
    {
      title: "AI 道具表生成器",
      description: "基于目录生成可编辑道具集",
      href: "/item-generator",
      stats: [
        { label: "道具集数量", value: String(itemSetCount) },
        { label: "最近道具集", value: latestItemSet?.name ?? "-" },
        { label: "最近生成时间", value: formatDate(latestItemSet?.createdAt) },
      ],
    },
    {
      title: "资源工作室",
      description: "生成 Prompt 与资源批次，导出 ZIP",
      href: "/asset-studio",
      stats: [
        { label: "资源批次", value: String(assetBatchCount) },
        { label: "成功资源数", value: String(assetDoneCount) },
        { label: "最近批次状态", value: latestAssetBatch?.status ?? "-" },
      ],
    },
    {
      title: "关卡生成器",
      description: "从道具集生成 LevelConfig 候选",
      href: "/level-generator",
      stats: [
        { label: "关卡总数", value: String(levelCount) },
        { label: "草稿关卡", value: String(levelDraftCount) },
        { label: "最近关卡", value: latestLevel?.name ?? "-" },
      ],
    },
    {
      title: "关卡编辑器",
      description: "可视化编辑、校验与保存关卡 JSON",
      href: "/level-editor",
      stats: [
        { label: "可编辑关卡", value: String(levelCount) },
        { label: "草稿", value: String(levelDraftCount) },
        { label: "最近编辑", value: formatDate(latestLevel?.updatedAt) },
      ],
    },
    {
      title: "公式实验室",
      description: "难度公式、单关诊断与批量回放",
      href: "/formula-lab",
      stats: [
        { label: "公式预设", value: String(formulaPresetCount) },
        { label: "诊断记录", value: String(diagnosisRunCount) },
        { label: "最近诊断", value: latestDiagnosis?.levelName ?? "-" },
      ],
    },
    {
      title: "自动续关生成器",
      description: "参考关卡与目标曲线批量续关",
      href: "/auto-level-generator",
      stats: [
        { label: "生成任务", value: String(autoRunCount) },
        { label: "最近任务状态", value: latestAutoRun?.status ?? "-" },
        { label: "最近生成数", value: String(latestAutoRun?.generateCount ?? 0) },
      ],
    },
    {
      title: "管线交付",
      description: "生产包、导入导出与关卡快照",
      href: "/pipeline",
      stats: [
        { label: "生产包", value: String(packageCount) },
        { label: "导出任务", value: String(exportJobCount) },
        { label: "导入任务", value: String(importJobCount) },
        { label: "关卡快照", value: String(snapshotCount) },
        { label: "最近包状态", value: latestPackage?.status ?? "-" },
      ],
    },
    {
      title: "试玩模拟器",
      description: "本地模拟通关率与 QA 评审",
      href: "/playtest-simulator",
      stats: [
        { label: "模拟任务", value: String(playtestRunCount) },
        { label: "最近平均通关率", value: formatPercent(latestPlaytestSummary?.avgPassRate) },
        { label: "待复核", value: String(latestPlaytestSummary?.needsReviewCount ?? 0) },
        { label: "最近任务", value: latestPlaytest?.name ?? "-" },
      ],
    },
    {
      title: "玩家数据回灌",
      description: "导入真实数据、诊断与优化提案",
      href: "/analytics-feedback",
      stats: [
        { label: "导入批次", value: String(analyticsBatchCount) },
        { label: "高严重度反馈", value: String(highSeverityFeedbackCount) },
        { label: "优化提案", value: String(optimizationCount) },
        { label: "最近批次", value: latestAnalyticsBatch?.name ?? "-" },
      ],
    },
  ];

  const summaryMetrics = [
    { label: "道具库", value: itemCount },
    { label: "道具集", value: itemSetCount },
    { label: "关卡", value: levelCount },
    { label: "资源批次", value: assetBatchCount },
  ];

  return (
    <AppShell>
      <AppHeader title={zh.pages.home.title} description={zh.pages.home.description} />
      <div className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryMetrics.map((m) => (
            <Card key={m.label} className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">{m.label}</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <WorkflowGuideSection />

        <section>
          <h2 className="mb-3 font-serif text-lg text-gray-900">功能模块</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((mod) => (
              <DashboardModuleCard key={mod.href} {...mod} />
            ))}
          </div>
        </section>

        <AiStatusCard {...aiStatus} />
      </div>
    </AppShell>
  );
}
