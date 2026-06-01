import { Suspense } from "react";

import { AiLabConsole } from "@/components/ai/AiLabConsole";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { WorkspaceRouteHydrator } from "@/components/shell/WorkspaceRouteHydrator";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { zh } from "@/lib/i18n/zh";
import { getAiStatus } from "@/lib/ai/gemini";

export default async function AiLabPage() {
  const status = await getAiStatus();

  return (
    <AppShell>
      <AppHeader title={zh.pages.aiLab.title} description={zh.pages.aiLab.description} fluid />
      <PageContent fluid className="pb-10">
        <Suspense fallback={null}>
          <WorkspaceRouteHydrator />
        </Suspense>
        <WorkspaceShell step="config">
          <AiLabConsole status={status} />
        </WorkspaceShell>
      </PageContent>
    </AppShell>
  );
}
