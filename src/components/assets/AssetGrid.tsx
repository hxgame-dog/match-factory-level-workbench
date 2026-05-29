"use client";

import { ImageOff } from "lucide-react";

import { AssetCard } from "./AssetCard";
import { EmptyState } from "@/components/ui/empty-state";

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
  assets: Asset[];
  onEditPrompt: (index: number) => void;
  onGenerate: (index: number) => void;
  onRetry: (index: number) => void;
  onSkip: (index: number) => void;
  onMarkDone: (index: number) => void;
};

export function AssetGrid(props: Props) {
  if (props.assets.length === 0) {
    return (
      <EmptyState
        icon={ImageOff}
        title="暂无资源"
        description="请先加载道具集并生成 Prompt，再批量或单张出图。"
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {props.assets.map((asset, index) => (
        <AssetCard
          key={`${asset.name}-${index}`}
          asset={asset}
          onEditPrompt={() => props.onEditPrompt(index)}
          onGenerate={() => props.onGenerate(index)}
          onRetry={() => props.onRetry(index)}
          onSkip={() => props.onSkip(index)}
          onMarkDone={() => props.onMarkDone(index)}
        />
      ))}
    </div>
  );
}
