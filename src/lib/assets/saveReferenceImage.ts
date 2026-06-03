import { mkdir, writeFile } from "fs/promises";
import path from "path";

function safeName(text: string) {
  return text.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 48);
}

/** 持久化风格参考图，供色板生成读取 */
export async function saveStyleReferenceImage(bytes: Buffer, mimeType: string): Promise<{
  referenceImageUrl: string;
  referenceLocalPath: string;
}> {
  const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
  const dir = path.join(process.cwd(), "public", "generated-assets", "style-references");
  await mkdir(dir, { recursive: true });
  const fileName = `ref_${safeName("style")}_${Date.now()}.${ext}`;
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, bytes);
  return {
    referenceImageUrl: `/generated-assets/style-references/${fileName}`,
    referenceLocalPath: absolutePath,
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
  const relative = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  const absolutePath = path.join(process.cwd(), "public", relative.replace(/^public\//, ""));
  try {
    const { readFile } = await import("fs/promises");
    return await readFile(absolutePath);
  } catch {
    return null;
  }
}
