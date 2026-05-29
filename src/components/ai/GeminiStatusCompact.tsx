import { CheckCircle2, Sparkles, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GeminiStatusCompactProps = {
  /** 文本生成（道具表）或图像生成（资源） */
  mode: "text" | "image";
  textModel?: string;
  imageModel?: string;
  available: boolean;
  className?: string;
};

export function GeminiStatusCompact({
  mode,
  textModel,
  imageModel,
  available,
  className,
}: GeminiStatusCompactProps) {
  const model = mode === "text" ? textModel : imageModel;
  const modelLabel = mode === "text" ? "文本模型" : "图像模型";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      <span className="font-medium text-foreground">Gemini 状态</span>
      {available ? (
        <Badge className="bg-emerald-600 hover:bg-emerald-600">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          可用
        </Badge>
      ) : (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
          <XCircle className="mr-1 h-3 w-3" />
          不可用
        </Badge>
      )}
      {model ? (
        <>
          <span className="text-muted-foreground">{modelLabel}</span>
          <code className="max-w-full break-all rounded bg-background px-1.5 py-0.5 font-mono text-xs">
            {model}
          </code>
        </>
      ) : null}
    </div>
  );
}
