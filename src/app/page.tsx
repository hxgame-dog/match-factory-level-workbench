import { getAiStatus } from "@/lib/ai/gemini";
import { getWorkspaceSummaries } from "@/lib/workspace/getWorkspaceSummaries";
import { ContinueLastWorkspaceBanner } from "@/components/dashboard/ContinueLastWorkspaceBanner";
import { WorkspaceHubSection } from "@/components/dashboard/WorkspaceHubSection";
import { DashboardModuleCard, type DashboardStatLine } from "@/components/dashboard/DashboardModuleCard";
import { WorkflowGuideSection } from "@/components/dashboard/WorkflowGuideSection";
import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { StatCard } from "@/components/ui/stat-card";
import { GeminiStatusCompact } from "@/components/ai/GeminiStatusCompact";
import { prisma } from "@/lib/prisma";

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
    workspaces,
    itemCount,
    itemSetCount,
    assetBatchCount,
    levelCount,
    playtestRunCount,
    aiStatus,
    aiLogCount,
    latestPlaytest,
  ] = await Promise.all([
    getWorkspaceSummaries(12),
    prisma.itemCatalog.count(),
    prisma.generatedItemSet.count(),
    prisma.assetGenerationBatch.count(),
    prisma.generatedLevel.count(),
    prisma.playtestSimulationRun.count(),
    getAiStatus(),
    prisma.aiGenerationLog.count(),
    prisma.playtestSimulationRun.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

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
      title: "AI 配置中心",
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
      title: "公式实验室",
      description: "难度公式、单关诊断与批量回放",
      href: "/formula-lab",
      stats: [
        { label: "关卡总数", value: String(levelCount) },
        { label: "试玩任务", value: String(playtestRunCount) },
        { label: "最近通关率", value: formatPercent(latestPlaytestSummary?.avgPassRate) },
      ],
    },
    {
      title: "自动续关生成器",
      description: "参考关卡与目标曲线批量续关",
      href: "/auto-level-generator",
      stats: [{ label: "关卡总数", value: String(levelCount) }],
    },
    {
      title: "玩家数据回灌",
      description: "导入真实数据、诊断与优化提案",
      href: "/analytics-feedback",
      stats: [{ label: "道具集", value: String(itemSetCount) }],
    },
  ];

  const summaryMetrics = [
    { label: "工作区", value: itemSetCount },
    { label: "上传库", value: itemCount },
    { label: "关卡", value: levelCount },
    { label: "资源批次", value: assetBatchCount },
  ];

  return (
    <AppShell>
      <AppHeader title={zh.pages.home.title} description={zh.pages.home.description} fluid />
      <PageContent wide className="space-y-8">
        <GeminiStatusCompact
          mode="text"
          textModel={aiStatus.textModel}
          available={aiStatus.hasGeminiKey && !aiStatus.mockMode}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryMetrics.map((m) => (
            <StatCard key={m.label} label={m.label} value={m.value} />
          ))}
        </div>

        <ContinueLastWorkspaceBanner workspaces={workspaces} />
        <WorkspaceHubSection workspaces={workspaces} />

        <WorkflowGuideSection />

        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">更多工具</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {modules.map((mod) => (
              <DashboardModuleCard key={mod.href} {...mod} />
            ))}
          </div>
        </section>
      </PageContent>
    </AppShell>
  );
}
