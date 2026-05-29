import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import type { LevelConfig } from "@/types/level";

export async function exportLevelsZip(levels: LevelConfig[], name: string) {
  const zip = new JSZip();
  levels.forEach((level, idx) => {
    zip.file(
      `levels/level_${String(level.levelIndex ?? idx + 1).padStart(3, "0")}.json`,
      JSON.stringify({ schemaVersion: 1, type: "match3d_level_config", level }, null, 2),
    );
  });
  const dir = path.join(process.cwd(), "public", "exports");
  await fs.mkdir(dir, { recursive: true });
  const fileName = `levels_${name.replace(/[^a-zA-Z0-9._-]/g, "_")}.zip`;
  await fs.writeFile(path.join(dir, fileName), await zip.generateAsync({ type: "nodebuffer" }));
  return `/exports/${fileName}`;
}
