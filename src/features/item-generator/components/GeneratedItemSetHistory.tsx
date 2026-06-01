"use client";

import type { GeneratedItemSetListItem } from "@/types/generatedItemSet";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  data: GeneratedItemSetListItem[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function GeneratedItemSetHistory({ data, onOpen, onDelete }: Props) {
  return (
    <Card >
      <CardHeader>
        <CardTitle className="text-lg">历史生成记录</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无历史记录</p>
        ) : (
          data.map((item) => (
            <div key={item.id} className="rounded-md border border-border p-3">
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                主题: {item.theme} / 道具数: {item.itemCount}
              </p>
              <p className="text-xs text-muted-foreground">
                时间: {new Date(item.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpen(item.id)}>
                  打开
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
