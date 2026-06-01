"use client";

import { Badge } from "@/components/ui/badge";
import type { LevelItemEntry } from "@/types/level";

type Props = {
  item?: LevelItemEntry;
  asset?: { imageUrl?: string; localPath?: string };
  selected: boolean;
  onClick: () => void;
};

export function LevelBoardCell({ item, asset, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-square rounded border p-1 text-left ${selected ? "border-blue-500 ring-2 ring-blue-200" : "border-border"} ${item ? "bg-card" : "bg-muted"}`}
      title={item ? `${item.name} / ${item.role} / ${item.count}` : "Empty"}
    >
      {item ? (
        <>
          {asset?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.imageUrl} alt={item.name} className="h-full w-full rounded object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{item.name.slice(0, 1)}</div>
          )}
          <div className="absolute right-1 top-1">
            <Badge variant={item.role === "target" ? "default" : "outline"}>{item.role.slice(0, 1).toUpperCase()}</Badge>
          </div>
          {!asset?.imageUrl ? <div className="absolute bottom-1 left-1 text-[10px] text-amber-600">Missing</div> : null}
        </>
      ) : null}
    </button>
  );
}
