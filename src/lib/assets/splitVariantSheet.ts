import { mkdir, writeFile } from "fs/promises";
import path from "path";

import sharp from "sharp";

import { STANDARD_COLOR_PALETTE } from "@/lib/items/colorPalette";
import { loadImageBytesFromStoredPath } from "@/lib/assets/saveReferenceImage";

function safeName(text: string) {
  return text.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48);
}

export async function persistSheetBytes(
  bytes: Buffer,
  baseName: string,
): Promise<{ imageUrl: string; localPath: string }> {
  const dir = path.join(process.cwd(), "public", "generated-assets", "sheets");
  await mkdir(dir, { recursive: true });
  const fileName = `${safeName(baseName)}_sheet_${Date.now()}.png`;
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, bytes);
  return {
    imageUrl: `/generated-assets/sheets/${fileName}`,
    localPath: absolutePath,
  };
}

export async function persistCroppedCellBytes(
  bytes: Buffer,
  baseName: string,
  colorKey: string,
): Promise<{ imageUrl: string; localPath: string }> {
  const dir = path.join(process.cwd(), "public", "generated-assets", "gemini");
  await mkdir(dir, { recursive: true });
  const fileName = `${safeName(baseName)}_${safeName(colorKey)}_${Date.now()}.png`;
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, bytes);
  return {
    imageUrl: `/generated-assets/gemini/${fileName}`,
    localPath: absolutePath,
  };
}

export type SplitVariantSheetResult = {
  sheetIndex: number;
  colorKey: string;
  imageUrl: string;
  localPath: string;
  skipped: boolean;
  reason?: string;
};

export type SplitVariantSheetOptions = {
  sheetImageUrl?: string | null;
  sheetLocalPath?: string | null;
  gridRows?: number;
  gridCols?: number;
  /** 组内需要写入的 color1 key */
  activeColorKeys: string[];
  baseItemName: string;
  outputSize?: "512x512" | "768x768" | "1024x1024";
  trimThreshold?: number;
};

export async function splitVariantSheet(
  options: SplitVariantSheetOptions,
): Promise<SplitVariantSheetResult[]> {
  const rows = options.gridRows ?? 2;
  const cols = options.gridCols ?? 4;
  const raw = await loadImageBytesFromStoredPath(options.sheetImageUrl, options.sheetLocalPath);
  if (!raw) {
    throw new Error("无法读取色板图文件");
  }

  const meta = await sharp(raw).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < cols || height < rows) {
    throw new Error("色板图尺寸过小，无法切分");
  }

  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const outW = options.outputSize ? Number(options.outputSize.split("x")[0]) : 512;
  const trimThreshold = options.trimThreshold ?? 10;

  const results: SplitVariantSheetResult[] = [];

  for (let sheetIndex = 0; sheetIndex < STANDARD_COLOR_PALETTE.length; sheetIndex += 1) {
    const colorKey = STANDARD_COLOR_PALETTE[sheetIndex].key;
    const col = sheetIndex % cols;
    const row = Math.floor(sheetIndex / cols);

    if (!options.activeColorKeys.includes(colorKey)) {
      results.push({
        sheetIndex,
        colorKey,
        imageUrl: "",
        localPath: "",
        skipped: true,
        reason: "组内无该颜色道具",
      });
      continue;
    }

    const left = col * cellW;
    const top = row * cellH;
    let pipeline = sharp(raw).extract({ left, top, width: cellW, height: cellH }).trim({
      threshold: trimThreshold,
    });

    if (outW > 0) {
      pipeline = pipeline.resize(outW, outW, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } });
    }

    const cellBytes = await pipeline.png().toBuffer();
    const saved = await persistCroppedCellBytes(cellBytes, options.baseItemName, colorKey);
    results.push({
      sheetIndex,
      colorKey,
      imageUrl: saved.imageUrl,
      localPath: saved.localPath,
      skipped: false,
    });
  }

  return results;
}
