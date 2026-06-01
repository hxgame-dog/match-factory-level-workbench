"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LevelItemEntry } from "@/types/level";

type Props = {
  items: LevelItemEntry[];
  assets: Record<string, { imageUrl?: string; localPath?: string; prompt?: string }>;
  mode: "target" | "spawn";
  onCountChange: (index: number, count: number) => void;
  onRoleChange?: (index: number, role: LevelItemEntry["role"]) => void;
  onRemove: (index: number) => void;
  onReplace: (index: number) => void;
};

export function LevelItemTable({ items, assets, mode, onCountChange, onRoleChange, onRemove, onReplace }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Preview</TableHead>
          {mode === "spawn" ? <TableHead>Role</TableHead> : null}
          <TableHead>Name</TableHead>
          <TableHead>DisplayName</TableHead>
          <TableHead>Category1</TableHead>
          <TableHead>Color1</TableHead>
          <TableHead>Shape</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Count</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => {
          const asset = item.assetKey ? assets[item.assetKey] : undefined;
          return (
            <TableRow key={`${item.name}-${index}`}>
              <TableCell>
                {asset?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.imageUrl} alt={item.name} className="h-10 w-10 rounded border border-border object-contain" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-muted text-xs">{item.name.slice(0, 1)}</div>
                )}
              </TableCell>
              {mode === "spawn" ? (
                <TableCell>
                  <Select value={item.role} onValueChange={(v) => onRoleChange?.(index, (v ?? item.role) as LevelItemEntry["role"])}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="target">target</SelectItem>
                      <SelectItem value="distractor">distractor</SelectItem>
                      <SelectItem value="filler">filler</SelectItem>
                      <SelectItem value="special">special</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              ) : null}
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.displayName ?? "-"}</TableCell>
              <TableCell>{item.category1}</TableCell>
              <TableCell>{item.color1 ?? "-"}</TableCell>
              <TableCell>{item.shape ?? "-"}</TableCell>
              <TableCell>{item.size ?? "-"}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  className="w-20"
                  value={item.count}
                  onChange={(e) => onCountChange(index, Number(e.target.value) || 1)}
                />
              </TableCell>
              <TableCell>{asset?.imageUrl ? <Badge>Ready</Badge> : <Badge variant="outline">Missing</Badge>}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => onReplace(index)}>替换</Button>
                  <Button size="sm" variant="outline" onClick={() => onRemove(index)}>删除</Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        {items.length === 0 ? (
          <TableRow><TableCell colSpan={mode === "spawn" ? 11 : 10} className="text-center text-muted-foreground">暂无道具</TableCell></TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
