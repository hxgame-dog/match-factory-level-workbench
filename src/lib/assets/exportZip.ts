import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";

type AssetRecord = {
  name: string;
  displayName?: string | null;
  sourceItemId?: number | null;
  catalogItemId?: string | null;
  generatedItemId?: string | null;
  role?: string | null;
  count?: number | null;
  imageUrl?: string | null;
  prompt: string;
  negativePrompt?: string | null;
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
}

export async function buildAssetBatchZip(params: {
  batchId: string;
  itemSetId: string;
  globalArtStyle?: string | null;
  assets: AssetRecord[];
}) {
  const zip = new JSZip();
  const imagesFolder = zip.folder("images");
  if (!imagesFolder) throw new Error("创建 ZIP 目录失败");

  const mappingAssets: Array<Record<string, unknown>> = [];
  const promptItems: Array<Record<string, unknown>> = [];

  for (const asset of params.assets) {
    let fileName = `${safeName(asset.name)}.svg`;
    if (asset.imageUrl) {
      const relative = asset.imageUrl.startsWith("/") ? asset.imageUrl.slice(1) : asset.imageUrl;
      const localPath = path.join(process.cwd(), "public", relative);
      try {
        const file = await fs.readFile(localPath);
        const ext = path.extname(localPath) || ".svg";
        fileName = `${safeName(asset.name)}${ext}`;
        imagesFolder.file(fileName, file);
      } catch {
        // 跳过不存在的文件，仍输出映射供排查
      }
    }

    mappingAssets.push({
      name: asset.name,
      displayName: asset.displayName ?? undefined,
      sourceItemId: asset.sourceItemId ?? undefined,
      catalogItemId: asset.catalogItemId ?? undefined,
      generatedItemId: asset.generatedItemId ?? undefined,
      role: asset.role ?? undefined,
      count: asset.count ?? undefined,
      imageUrl: asset.imageUrl ?? undefined,
      fileName,
    });
    promptItems.push({
      name: asset.name,
      prompt: asset.prompt,
      negativePrompt: asset.negativePrompt ?? undefined,
    });
  }

  zip.file(
    "mapping.json",
    JSON.stringify(
      {
        batchId: params.batchId,
        itemSetId: params.itemSetId,
        assets: mappingAssets,
      },
      null,
      2,
    ),
  );
  zip.file(
    "prompts.json",
    JSON.stringify(
      {
        globalArtStyle: params.globalArtStyle ?? "",
        items: promptItems,
      },
      null,
      2,
    ),
  );

  return zip.generateAsync({ type: "nodebuffer" });
}
