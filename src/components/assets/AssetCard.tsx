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
            <div className="flex h-full items-center justify-center text-xs text-gray-400">No Image</div>
          )}
        </div>
        <p className="font-medium text-gray-900">{asset.name}</p>
        <p className="text-xs text-gray-500">{asset.displayName ?? "-"}</p>
        <div className="flex flex-wrap gap-1">
          {asset.role ? <Badge variant="secondary">{asset.role}</Badge> : null}
          <Badge variant="outline">{asset.category1}</Badge>
          {asset.size ? <Badge variant="outline">{asset.size}</Badge> : null}
          <Badge variant={statusVariant[asset.status] ?? "outline"}>{asset.status}</Badge>
        </div>
        <p className="line-clamp-2 text-xs text-gray-600">{asset.prompt}</p>
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={props.onEditPrompt}>Edit Prompt</Button>
          <Button size="sm" onClick={props.onGenerate}>Generate</Button>
          <Button size="sm" variant="outline" onClick={props.onRetry}>Retry</Button>
          <Button size="sm" variant="outline" onClick={props.onMarkDone}>Mark Done</Button>
          <Button size="sm" variant="outline" onClick={props.onSkip}>Skip</Button>
        </div>
      </CardContent>
    </Card>
  );
}
