import { CheckCircle2, ImageIcon, KeyRound, Sparkles, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DescriptionItem, DescriptionList } from "@/components/ui/description-list";
import { cn } from "@/lib/utils";

type AiStatusCardProps = {
  provider: string;
  textModel: string;
  imageModel: string;
  mockMode: boolean;
  hasGeminiKey: boolean;
  keySource?: string;
  keyHint?: string;
  imageGenerationReady?: boolean;
  className?: string;
};

const KEY_SOURCE_LABEL: Record<string, string> = {
  session: "浏览器会话（HttpOnly）",
  env: "服务器环境变量",
  none: "未配置",
};

export function AiStatusCard(props: AiStatusCardProps) {
  const ready = props.imageGenerationReady ?? false;

  return (
    <Card className={cn("overflow-hidden", props.className)}>
      <CardHeader className="border-b border-border bg-muted/30 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Gemini 状态
          </CardTitle>
          {ready ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              真实出图可用
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
              <XCircle className="mr-1 h-3 w-3" />
              出图不可用
            </Badge>
          )}
        </div>
        <CardDescription>连接与模型配置概览</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <DescriptionList variant="bordered" className="border-0">
          <DescriptionItem label="模型提供商">
            <Badge variant="outline">{props.provider}</Badge>
          </DescriptionItem>
          <DescriptionItem label="文本模型">
            <code className="break-all rounded-md bg-muted px-2 py-1 font-mono text-xs">{props.textModel}</code>
          </DescriptionItem>
          <DescriptionItem label="图像模型">
            <code className="break-all rounded-md bg-muted px-2 py-1 font-mono text-xs">{props.imageModel}</code>
          </DescriptionItem>
          <DescriptionItem label="API Key">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs">
              <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {props.hasGeminiKey ? props.keyHint ?? "已配置" : "未配置"}
            </span>
          </DescriptionItem>
          {props.keySource ? (
            <DescriptionItem label="Key 来源">{KEY_SOURCE_LABEL[props.keySource] ?? props.keySource}</DescriptionItem>
          ) : null}
          <DescriptionItem label="Mock 模式">
            <Badge variant={props.mockMode ? "default" : "secondary"}>
              {props.mockMode ? "开启（无 Key 时）" : "关闭"}
            </Badge>
          </DescriptionItem>
          <DescriptionItem label="真实出图">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant={ready ? "default" : "outline"} className={ready ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
                {ready ? "可用" : "不可用"}
              </Badge>
            </span>
          </DescriptionItem>
        </DescriptionList>
      </CardContent>
    </Card>
  );
}
