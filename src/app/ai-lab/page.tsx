import { AiLabConsole } from "@/components/ai/AiLabConsole";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { PageContent } from "@/components/layout/PageContent";
import { zh } from "@/lib/i18n/zh";
import { getAiStatus } from "@/lib/ai/gemini";

export default async function AiLabPage() {
  const status = await getAiStatus();

  return (
    <AppShell>
      <AppHeader title={zh.pages.aiLab.title} description={zh.pages.aiLab.description} />
      <PageContent className="pb-10">
        <AiLabConsole status={status} />
      </PageContent>
    </AppShell>
  );
}
