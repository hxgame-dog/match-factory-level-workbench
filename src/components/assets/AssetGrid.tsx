"use client";

import { AssetCard } from "./AssetCard";

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
    return <div className="rounded-md border border-dashed border-gray-300 p-8 text-sm text-gray-500">暂无资源，请先加载 Item Set 并生成 Prompt。</div>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
