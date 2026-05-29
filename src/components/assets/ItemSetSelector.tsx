"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ItemSet = {
  id: string;
  name: string;
  theme: string;
  itemCount: number;
  createdAt: string;
};

type Props = {
  itemSets: ItemSet[];
  selectedId: string;
  onChange: (id: string) => void;
  onLoad: () => void;
  onRefresh: () => void;
  detail?: {
    name: string;
    theme: string;
    total: number;
    targetCount: number;
    distractorCount: number;
    createdAt: string;
  };
};

export function ItemSetSelector(props: Props) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Item Set 选择区</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={props.selectedId || "none"} onValueChange={(v) => props.onChange(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择 Generated Item Set" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">请选择</SelectItem>
            {props.itemSets.map((set) => (
              <SelectItem key={set.id} value={set.id}>
                {set.name} / {set.theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button onClick={props.onLoad}>Load Item Set</Button>
          <Button variant="outline" onClick={props.onRefresh}>
            Refresh List
          </Button>
        </div>
        {props.detail ? (
          <div className="rounded-md border border-gray-200 p-3 text-sm text-gray-700">
            <p>名称：{props.detail.name}</p>
            <p>主题：{props.detail.theme}</p>
            <p>道具数量：{props.detail.total}</p>
            <p>目标物数量：{props.detail.targetCount}</p>
            <p>干扰物数量：{props.detail.distractorCount}</p>
            <p>创建时间：{new Date(props.detail.createdAt).toLocaleString()}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
