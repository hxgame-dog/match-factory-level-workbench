import { mkdir, writeFile } from "fs/promises";
import path from "path";

function safeName(text: string) {
  return text.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48);
}

/** Vercel /serverless 上 public 目录不可写，使用 data URL 存库 */
export function shouldUseDataUrlStorage(): boolean {
  return Boolean(process.env.VERCEL) || process.env.ASSET_STORAGE_MODE === "dataurl";
}

export function bytesToDataUrl(bytes: Buffer, mimeType: string): { imageUrl: string; localPath: string } {
  const resolvedMime = mimeType || "image/png";
  const b64 = bytes.toString("base64");
  return {
    imageUrl: `data:${resolvedMime};base64,${b64}`,
    localPath: "",
  };
}

export async function persistGeneratedImageBytes(
  bytes: Buffer,
  options: {
    mimeType: string;
    subdir: "gemini" | "sheets" | "style-references" | "mock";
    baseName: string;
    fileSuffix?: string;
  },
): Promise<{ imageUrl: string; localPath: string }> {
  const { mimeType, subdir, baseName, fileSuffix = "" } = options;

  if (shouldUseDataUrlStorage()) {
    return bytesToDataUrl(bytes, mimeType);
  }

  const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : mimeType.includes("svg") ? "svg" : "png";
  try {
    const dir = path.join(process.cwd(), "public", "generated-assets", subdir);
    await mkdir(dir, { recursive: true });
    const fileName = `${safeName(baseName)}${fileSuffix ? `_${safeName(fileSuffix)}` : ""}_${Date.now()}.${ext}`;
    const absolutePath = path.join(dir, fileName);
    await writeFile(absolutePath, bytes);
    return {
      imageUrl: `/generated-assets/${subdir}/${fileName}`,
      localPath: absolutePath,
    };
  } catch {
    return bytesToDataUrl(bytes, mimeType);
  }
}
