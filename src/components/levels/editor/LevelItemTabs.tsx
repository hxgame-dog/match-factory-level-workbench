"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LevelConfig, LevelItemEntry } from "@/types/level";

import { LevelItemPickerDialog } from "./LevelItemPickerDialog";
import { LevelItemTable } from "./LevelItemTable";

type Props = {
  level: LevelConfig;
  sourceItems: LevelItemEntry[];
  assets: Record<string, { imageUrl?: string; localPath?: string; prompt?: string }>;
  onChange: (level: LevelConfig) => void;
};

export function LevelItemTabs({ level, sourceItems, assets, onChange }: Props) {
  const [picker, setPicker] = useState<{ open: boolean; mode: "target" | "spawn"; replaceIndex?: number }>({
    open: false,
    mode: "target",
  });

  function openPicker(mode: "target" | "spawn", replaceIndex?: number) {
    setPicker({ open: true, mode, replaceIndex });
  }

  return (
    <>
      <Tabs defaultValue="targets">
        <TabsList>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="spawns">Spawns</TabsTrigger>
        </TabsList>
        <TabsContent value="targets" className="space-y-2">
          <Button size="sm" onClick={() => openPicker("target")}>添加 Target</Button>
          <LevelItemTable
            mode="target"
            items={level.targets}
            assets={assets}
            onCountChange={(index, count) =>
              onChange({
                ...level,
                targets: level.targets.map((item, i) => (i === index ? { ...item, count: Math.max(1, count) } : item)),
              })
            }
            onRemove={(index) =>
              onChange({
                ...level,
                targets: level.targets.filter((_, i) => i !== index),
              })
            }
            onReplace={(index) => openPicker("target", index)}
          />
        </TabsContent>
        <TabsContent value="spawns" className="space-y-2">
          <Button size="sm" onClick={() => openPicker("spawn")}>添加 Spawn</Button>
          <LevelItemTable
            mode="spawn"
            items={level.spawns}
            assets={assets}
            onCountChange={(index, count) =>
              onChange({
                ...level,
                spawns: level.spawns.map((item, i) => (i === index ? { ...item, count: Math.max(1, count) } : item)),
              })
            }
            onRoleChange={(index, role) =>
              onChange({
                ...level,
                spawns: level.spawns.map((item, i) => (i === index ? { ...item, role } : item)),
              })
            }
            onRemove={(index) =>
              onChange({
                ...level,
                spawns: level.spawns.filter((_, i) => i !== index),
              })
            }
            onReplace={(index) => openPicker("spawn", index)}
          />
        </TabsContent>
      </Tabs>

      <LevelItemPickerDialog
        open={picker.open}
        sourceItems={sourceItems}
        mode={picker.mode}
        onPick={(item) => {
          if (picker.mode === "target") {
            if (picker.replaceIndex != null) {
              const next = [...level.targets];
              next[picker.replaceIndex] = { ...item, role: "target", assetKey: item.name };
              onChange({ ...level, targets: next });
            } else {
              onChange({ ...level, targets: [...level.targets, { ...item, role: "target", assetKey: item.name }] });
            }
          } else if (picker.replaceIndex != null) {
            const next = [...level.spawns];
            next[picker.replaceIndex] = { ...item, assetKey: item.name };
            onChange({ ...level, spawns: next });
          } else {
            onChange({ ...level, spawns: [...level.spawns, { ...item, assetKey: item.name }] });
          }
          setPicker({ open: false, mode: "target" });
        }}
        onClose={() => setPicker({ open: false, mode: "target" })}
      />
    </>
  );
}
