"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Asset = {
  id?: string;
  name: string;
  displayName?: string;
  role?: string;
  category1: string;
  size?: string;
  status: string;
  prompt: string;
  imageUrl?: string;
  error?: string;
};

type Props = {
  asset: Asset;
  onEditPrompt: () => void;
  onGenerate: () => void;
  onRetry: () => void;
  onSkip: () => void;
  onMarkDone: () => void;
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  prompt_ready: "secondary",
  generating: "secondary",
  done: "default",
  failed: "destructive",
  skipped: "outline",
};

const statusLabel: Record<string, string> = {
  pending: "待处理",
  prompt_ready: "Prompt 就绪",
  generating: "生成中",
  done: "完成",
  failed: "失败",
  skipped: "已跳过",
};

export function AssetCard(props: Props) {
  const { asset } = props;
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="space-y-2 p-3">
        <div className="aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {asset.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">暂无图片</div>
          )}
        </div>
        <p className="font-medium text-gray-900">{asset.name}</p>
        <p className="text-xs text-gray-500">{asset.displayName ?? "-"}</p>
        <div className="flex flex-wrap gap-1">
          {asset.role ? <Badge variant="secondary">{asset.role}</Badge> : null}
          <Badge variant="outline">{asset.category1}</Badge>
          {asset.size ? <Badge variant="outline">{asset.size}</Badge> : null}
          <Badge variant={statusVariant[asset.status] ?? "outline"}>
            {statusLabel[asset.status] ?? asset.status}
          </Badge>
        </div>
        <p className="line-clamp-2 text-xs text-gray-600">{asset.prompt}</p>
        {asset.status === "failed" && asset.error ? (
          <p className="line-clamp-3 text-xs text-red-600" title={asset.error}>
            {asset.error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={props.onEditPrompt}>
            编辑 Prompt
          </Button>
          <Button size="sm" onClick={props.onGenerate}>
            生成图片
          </Button>
          <Button size="sm" variant="outline" onClick={props.onRetry}>
            重试
          </Button>
          <Button size="sm" variant="outline" onClick={props.onMarkDone}>
            标记完成
          </Button>
          <Button size="sm" variant="outline" onClick={props.onSkip}>
            跳过
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
