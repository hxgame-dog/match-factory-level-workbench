import { AiLabConsole } from "@/components/ai/AiLabConsole";
import { WorkspacePageLayout } from "@/features/workspace";
import { zh } from "@/lib/i18n/zh";
import { getAiStatus } from "@/lib/ai/gemini";

export default async function AiLabPage() {
  const status = await getAiStatus();

  return (
    <WorkspacePageLayout
      title={zh.pages.aiLab.title}
      description={zh.pages.aiLab.description}
      step="config"
      contentClassName="pb-10"
    >
      <AiLabConsole status={status} />
    </WorkspacePageLayout>
  );
}
