import { AiStatusCard } from "@/components/ai/AiStatusCard";
import { AiTestPanel } from "@/components/ai/AiTestPanel";
import { GeminiSettingsPanel } from "@/components/ai/GeminiSettingsPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { zh } from "@/lib/i18n/zh";
import { getAiStatus } from "@/lib/ai/gemini";

export default async function AiLabPage() {
  const status = await getAiStatus();

  return (
    <AppShell>
      <AppHeader title={zh.pages.aiLab.title} description={zh.pages.aiLab.description} />
      <div className="space-y-4 p-6">
        <AiStatusCard {...status} />
        <GeminiSettingsPanel />
        <AiTestPanel />
      </div>
    </AppShell>
  );
}
