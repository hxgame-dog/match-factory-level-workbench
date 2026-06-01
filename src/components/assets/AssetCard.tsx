"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
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

export function AssetCard(props: Props) {
  const { asset } = props;
  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted">
          {asset.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">暂无图片</div>
          )}
        </div>
        <p className="font-medium text-foreground">{asset.name}</p>
        <p className="text-xs text-muted-foreground">{asset.displayName ?? "-"}</p>
        <div className="flex flex-wrap gap-1">
          {asset.role ? <Badge variant="secondary">{asset.role}</Badge> : null}
          <Badge variant="outline">{asset.category1}</Badge>
          {asset.size ? <Badge variant="outline">{asset.size}</Badge> : null}
          <StatusBadge status={asset.status} />
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{asset.prompt}</p>
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
