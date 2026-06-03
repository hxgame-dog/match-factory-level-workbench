"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = {
  title: string;
  subtitle?: string;
  status: string;
  sheetImageUrl?: string;
  prompt?: string;
  error?: string;
  showGridOverlay?: boolean;
  actions: React.ReactNode;
};

export function VariantSheetCard(props: Props) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="relative aspect-[2/1] overflow-hidden rounded-md border border-border bg-muted">
          {props.sheetImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={props.sheetImageUrl}
                alt={props.title}
                className="h-full w-full object-contain"
              />
              {props.showGridOverlay ? (
                <div
                  className="pointer-events-none absolute inset-0 grid grid-cols-4 grid-rows-2"
                  aria-hidden
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border border-primary/30 bg-primary/5" />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              暂无色板图（2×4）
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">{props.title}</p>
          {props.subtitle ? <p className="text-xs text-muted-foreground">{props.subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">2×4 色板</Badge>
          <StatusBadge status={props.status} />
        </div>
        {props.prompt ? (
          <p className="line-clamp-3 text-xs text-muted-foreground">{props.prompt}</p>
        ) : null}
        {props.error ? (
          <p className="line-clamp-2 text-xs text-red-600">{props.error}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">{props.actions}</div>
      </CardContent>
    </Card>
  );
}
