"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LevelItemEntry } from "@/types/level";

type Props = {
  open: boolean;
  sourceItems: LevelItemEntry[];
  mode: "target" | "spawn";
  onPick: (item: LevelItemEntry) => void;
  onClose: () => void;
};

export function LevelItemPickerDialog({ open, sourceItems, mode, onPick, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [role, setRole] = useState("all");
  const [color, setColor] = useState("all");

  const categories = [...new Set(sourceItems.map((i) => i.category1))];
  const colors = [...new Set(sourceItems.map((i) => i.color1).filter(Boolean) as string[])];
  const roles = [...new Set(sourceItems.map((i) => i.role))];

  const filtered = useMemo(
    () =>
      sourceItems.filter((item) => {
        const text = `${item.name} ${item.displayName ?? ""}`.toLowerCase();
        return (
          (!search || text.includes(search.toLowerCase())) &&
          (category === "all" || item.category1 === category) &&
          (role === "all" || item.role === role) &&
          (color === "all" || item.color1 === color)
        );
      }),
    [sourceItems, search, category, role, color],
  );

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl rounded-md border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">选择道具</h3>
        <div className="mb-3 grid gap-2 md:grid-cols-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索 name/displayName" />
          <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
            <SelectTrigger><SelectValue placeholder="Category1" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部 Category</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={role} onValueChange={(v) => setRole(v ?? "all")}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部 Role</SelectItem>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={color} onValueChange={(v) => setColor(v ?? "all")}>
            <SelectTrigger><SelectValue placeholder="Color1" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部 Color</SelectItem>{colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="max-h-[45vh] space-y-2 overflow-auto">
          {filtered.map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">{item.category1} / {item.role}</p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  onPick({
                    ...item,
                    role: mode === "target" ? "target" : item.role,
                  })
                }
              >
                选择
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}
