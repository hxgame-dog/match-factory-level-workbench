import { persistGeneratedImageBytes } from "@/lib/assets/persistGeneratedImage";

/** 持久化风格参考图，供色板生成读取（Vercel 下为 data URL 存库） */
export async function saveStyleReferenceImage(bytes: Buffer, mimeType: string): Promise<{
  referenceImageUrl: string;
  referenceLocalPath: string;
}> {
  const saved = await persistGeneratedImageBytes(bytes, {
    mimeType: mimeType || "image/png",
    subdir: "style-references",
    baseName: "style",
  });
  return {
    referenceImageUrl: saved.imageUrl,
    referenceLocalPath: saved.localPath,
  };
}

export async function loadImageBytesFromStoredPath(
  imageUrl?: string | null,
  localPath?: string | null,
): Promise<Buffer | null> {
  if (localPath) {
    try {
      const { readFile } = await import("fs/promises");
      return await readFile(localPath);
    } catch {
      /* fall through */
    }
  }
  if (!imageUrl) return null;
  if (imageUrl.startsWith("data:")) {
    const b64 = imageUrl.split(",")[1];
    return b64 ? Buffer.from(b64, "base64") : null;
  }
  const path = await import("path");
  const relative = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  const absolutePath = path.join(process.cwd(), "public", relative.replace(/^public\//, ""));
  try {
    const { readFile } = await import("fs/promises");
    return await readFile(absolutePath);
  } catch {
    return null;
  }
}
