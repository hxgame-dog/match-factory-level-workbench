import { PlaytestSimulatorPage } from "@/features/playtest";
import { WorkspacePageLayout } from "@/features/workspace";
import { getAiStatus } from "@/lib/ai/gemini";
import { zh } from "@/lib/i18n/zh";
import { prisma } from "@/lib/prisma";

export default async function PlaytestSimulatorRoute() {
  const [levels, runs, aiStatus] = await Promise.all([
    prisma.generatedLevel.findMany({ orderBy: [{ levelIndex: "asc" }, { createdAt: "desc" }], take: 200 }),
    prisma.playtestSimulationRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    getAiStatus(),
  ]);
  return (
    <WorkspacePageLayout
      title={zh.pages.playtestSimulator.title}
      description={zh.pages.playtestSimulator.description}
      step="validate"
    >
      <PlaytestSimulatorPage
        levels={levels.map((l) => ({ id: l.id, name: l.name, levelIndex: l.levelIndex }))}
        runs={runs.map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          summaryJson: r.summaryJson,
          createdAt: r.createdAt.toISOString(),
        }))}
        mockMode={aiStatus.mockMode}
      />
    </WorkspacePageLayout>
  );
}
