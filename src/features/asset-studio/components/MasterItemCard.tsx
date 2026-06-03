"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type Props = {
  name: string;
  displayName?: string;
  role?: string;
  category1?: string;
  size?: string;
  pattern?: string;
  color1?: string;
  status: string;
  prompt?: string;
  imageUrl?: string;
  error?: string;
  isMaster?: boolean;
  actions: React.ReactNode;
};

export function MasterItemCard(props: Props) {
  return (
    <Card className={props.isMaster ? "border-primary/40" : undefined}>
      <CardContent className="space-y-2 p-3">
        <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted">
          {props.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.imageUrl} alt={props.name} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">暂无图片</div>
          )}
        </div>
        <p className="font-medium text-foreground">{props.name}</p>
        <p className="text-xs text-muted-foreground">{props.displayName ?? "-"}</p>
        <div className="flex flex-wrap gap-1">
          {props.isMaster ? <Badge variant="default">母版</Badge> : null}
          {props.role ? <Badge variant="secondary">{props.role}</Badge> : null}
          {props.category1 ? <Badge variant="outline">{props.category1}</Badge> : null}
          {props.size ? <Badge variant="outline">{props.size}</Badge> : null}
          {props.color1 ? <Badge variant="outline">{props.color1}</Badge> : null}
          {props.pattern ? <Badge variant="outline">{props.pattern}</Badge> : null}
          <StatusBadge status={props.status} />
        </div>
        {props.prompt ? <p className="line-clamp-2 text-xs text-muted-foreground">{props.prompt}</p> : null}
        {props.status === "failed" && props.error ? (
          <p className="line-clamp-3 text-xs text-red-600" title={props.error}>
            {props.error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1">{props.actions}</div>
      </CardContent>
    </Card>
  );
}
