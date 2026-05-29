import { useMemo, useState } from "react";
import type { GenerateItemsResult } from "@/types/ai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  items: GenerateItemsResult["items"];
  onChange: (items: GenerateItemsResult["items"]) => void;
};

const roles = ["target", "distractor", "filler", "special"] as const;

export function GeneratedItemsTable({ items, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category1))].filter(Boolean),
    [items],
  );

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.displayName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || item.role === roleFilter;
    const matchCategory = categoryFilter === "all" || item.category1 === categoryFilter;
    return matchSearch && matchRole && matchCategory;
  });

  function patchItem(index: number, patch: Partial<GenerateItemsResult["items"][number]>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <Input placeholder="搜索 Name / DisplayName" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
          <SelectTrigger><SelectValue placeholder="筛选 Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部 Role</SelectItem>
            {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger><SelectValue placeholder="筛选 Category1" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部 Category1</SelectItem>
            {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Source ItemId</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>DisplayName</TableHead>
            <TableHead>Category1</TableHead>
            <TableHead>Category2</TableHead>
            <TableHead>Color1</TableHead>
            <TableHead>Color2</TableHead>
            <TableHead>Shape</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>TargetScale</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>IsNew</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>ImagePrompt</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => {
            const index = items.indexOf(item);
            return (
            <TableRow key={`${item.name}-${index}`}>
              <TableCell>
                <Select
                  value={item.role}
                  onValueChange={(value) =>
                    patchItem(index, { role: (value ?? item.role) as typeof item.role })
                  }
                >
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
                </Select>
                {item.role === "target" ? <Badge className="ml-2">Target</Badge> : null}
              </TableCell>
              <TableCell>{item.sourceItemId ?? "-"}</TableCell>
              <TableCell>
                <Input value={item.name} onChange={(e) => patchItem(index, { name: e.target.value })} />
              </TableCell>
              <TableCell>
                <Input value={item.displayName ?? ""} onChange={(e) => patchItem(index, { displayName: e.target.value || undefined })} />
              </TableCell>
              <TableCell>{item.category1}</TableCell>
              <TableCell>{item.category2 ?? "-"}</TableCell>
              <TableCell>{item.color1 ?? "-"}</TableCell>
              <TableCell>{item.color2 ?? "-"}</TableCell>
              <TableCell>{item.shape ?? "-"}</TableCell>
              <TableCell>{item.size ?? "-"}</TableCell>
              <TableCell>{item.targetScale ?? "-"}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  className="w-20"
                  value={item.count}
                  onChange={(e) => patchItem(index, { count: Math.max(1, Number(e.target.value) || 1) })}
                />
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  className="text-sm"
                  onClick={() => patchItem(index, { isNew: !item.isNew })}
                >
                  {item.isNew ? <Badge variant="secondary">New</Badge> : "false"}
                </button>
              </TableCell>
              <TableCell>
                <Input value={item.reason} onChange={(e) => patchItem(index, { reason: e.target.value })} />
              </TableCell>
              <TableCell>
                <Input value={item.imagePrompt} onChange={(e) => patchItem(index, { imagePrompt: e.target.value })} />
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => removeItem(index)}>
                  删除
                </Button>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
}
