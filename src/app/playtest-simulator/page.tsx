import { Suspense } from "react";

import { getAiStatus } from "@/lib/ai/gemini";
import { zh } from "@/lib/i18n/zh";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { PlaytestSimulatorPage } from "@/components/playtest/PlaytestSimulatorPage";
import { WorkspaceRouteHydrator } from "@/components/shell/WorkspaceRouteHydrator";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { prisma } from "@/lib/prisma";

export default async function PlaytestSimulatorRoute() {
  const [levels, runs, aiStatus] = await Promise.all([
    prisma.generatedLevel.findMany({ orderBy: [{ levelIndex: "asc" }, { createdAt: "desc" }], take: 200 }),
    prisma.playtestSimulationRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    getAiStatus(),
  ]);
  return (
    <AppShell>
      <AppHeader title={zh.pages.playtestSimulator.title} description={zh.pages.playtestSimulator.description} fluid />
      <PageContent fluid>
        <Suspense fallback={null}>
          <WorkspaceRouteHydrator />
        </Suspense>
        <WorkspaceShell step="validate">
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
        </WorkspaceShell>
      </PageContent>
    </AppShell>
  );
}
