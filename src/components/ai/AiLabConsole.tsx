"use client";

import { FlaskConical, Settings2, TestTube2 } from "lucide-react";

import { AiStatusCard } from "@/components/ai/AiStatusCard";
import { AiTestPanel } from "@/components/ai/AiTestPanel";
import { GeminiSettingsPanel } from "@/components/ai/GeminiSettingsPanel";
import { PageSection } from "@/components/layout/PageSection";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AiLabConsoleProps = {
  status: React.ComponentProps<typeof AiStatusCard>;
};

export function AiLabConsole({ status }: AiLabConsoleProps) {
  const ready = status.imageGenerationReady ?? false;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Studio Console 顶栏：连接状态一目了然 */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3",
          ready ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80",
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
            ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800",
          )}
        >
          <FlaskConical className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Gemini 连接控制台</p>
          <p className="text-sm text-muted-foreground">
            {ready ? "已配置 Key，可进行真实文本与图像生成" : "请先配置 API Key 或开启 Mock 模式"}
          </p>
        </div>
        <Badge className={ready ? "bg-emerald-600 hover:bg-emerald-600" : ""} variant={ready ? "default" : "secondary"}>
          {ready ? "就绪" : "待配置"}
        </Badge>
      </div>

      <PageSection
        title="连接状态"
        description="当前模型与 Key 来源（键值紧邻展示，便于宽屏阅读）"
        icon={<Settings2 className="h-4 w-4" />}
      >
        <AiStatusCard {...status} className="w-full max-w-none shadow-sm" />
      </PageSection>

      <PageSection
        title="连接配置"
        description="保存 Key、选择模型并执行连通性测试"
        icon={<Settings2 className="h-4 w-4" />}
      >
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <GeminiSettingsPanel compact />
        </div>
      </PageSection>

      <PageSection
        title="功能测试"
        description="发送测试 Prompt，验证文本接口是否正常"
        icon={<TestTube2 className="h-4 w-4" />}
      >
        <AiTestPanel />
      </PageSection>
    </div>
  );
}
