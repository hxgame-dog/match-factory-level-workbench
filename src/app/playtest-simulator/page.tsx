import { getAiStatus } from "@/lib/ai/gemini";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PlaytestSimulatorPage } from "@/components/playtest/PlaytestSimulatorPage";
import { prisma } from "@/lib/prisma";

export default async function PlaytestSimulatorRoute() {
  const [levels, runs, aiStatus] = await Promise.all([
    prisma.generatedLevel.findMany({ orderBy: [{ levelIndex: "asc" }, { createdAt: "desc" }], take: 200 }),
    prisma.playtestSimulationRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    getAiStatus(),
  ]);
  return (
    <AppShell>
      <AppHeader title="Playtest Simulator" description="本地试玩模拟、QA 评审与平衡建议。" />
      <div className="p-6">
        <PlaytestSimulatorPage
          levels={levels.map((l) => ({ id: l.id, name: l.name, levelIndex: l.levelIndex }))}
          runs={runs.map((r) => ({ id: r.id, name: r.name, status: r.status, summaryJson: r.summaryJson, createdAt: r.createdAt.toISOString() }))}
          mockMode={aiStatus.mockMode}
        />
      </div>
    </AppShell>
  );
}
