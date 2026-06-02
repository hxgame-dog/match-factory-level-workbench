"use client";

import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zh } from "@/lib/i18n/zh";
import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

const t = zh.pages.itemGenerator;

type Props = {
  data: GeneratedItemSetListItem[];
  defaultId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
};

export function GeneratedItemSetHistory({ data, defaultId, onOpen, onDelete, onSetDefault }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t.historyTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无历史记录</p>
        ) : (
          data.map((item) => (
            <div key={item.id} className="rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.name}</p>
                {defaultId === item.id ? (
                  <Badge variant="secondary">{t.actions.defaultBadge}</Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                主题: {item.theme} / 道具数: {item.itemCount}
              </p>
              <p className="text-xs text-muted-foreground">
                时间: {new Date(item.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpen(item.id)}>
                  打开
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSetDefault(item.id)}
                  disabled={defaultId === item.id}
                >
                  <Star className="mr-1 h-3.5 w-3.5" />
                  {defaultId === item.id ? t.actions.defaultBadge : t.actions.setDefault}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(item.id)}>
                  删除
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
