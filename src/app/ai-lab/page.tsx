import { AiStatusCard } from "@/components/ai/AiStatusCard";
import { AiTestPanel } from "@/components/ai/AiTestPanel";
import { GeminiSettingsPanel } from "@/components/ai/GeminiSettingsPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { getAiStatus } from "@/lib/ai/gemini";

export default async function AiLabPage() {
  const status = await getAiStatus();

  return (
    <AppShell>
      <AppHeader
        title="AI Lab"
        description="配置 Gemini API Key、检测模型、测试文本与图像生成。Key 仅存服务端，不会泄露到前端。"
      />
      <div className="space-y-4 p-6">
        <AiStatusCard {...status} />
        <GeminiSettingsPanel />
        <AiTestPanel />
      </div>
    </AppShell>
  );
}
