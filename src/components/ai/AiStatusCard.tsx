import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AiStatusCardProps = {
  provider: string;
  textModel: string;
  imageModel: string;
  mockMode: boolean;
  hasGeminiKey: boolean;
  keySource?: string;
  keyHint?: string;
  imageGenerationReady?: boolean;
};

const KEY_SOURCE_LABEL: Record<string, string> = {
  session: "浏览器会话（HttpOnly）",
  env: "服务器环境变量",
  none: "未配置",
};

export function AiStatusCard(props: AiStatusCardProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Gemini 状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center justify-between">
          <span>模型提供商</span>
          <Badge variant="outline">{props.provider}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>文本模型</span>
          <span className="max-w-[60%] truncate text-right">{props.textModel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>图像模型</span>
          <span className="max-w-[60%] truncate text-right">{props.imageModel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>API Key</span>
          <span>{props.hasGeminiKey ? props.keyHint ?? "已配置" : "未配置"}</span>
        </div>
        {props.keySource ? (
          <div className="flex items-center justify-between">
            <span>Key 来源</span>
            <span>{KEY_SOURCE_LABEL[props.keySource] ?? props.keySource}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span>Mock 模式</span>
          <Badge variant={props.mockMode ? "default" : "secondary"}>
            {props.mockMode ? "开启（无 Key 时）" : "关闭"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>真实出图</span>
          <Badge variant={props.imageGenerationReady ? "default" : "outline"}>
            {props.imageGenerationReady ? "可用" : "不可用"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
