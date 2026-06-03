import { generateGeminiImage } from "@/lib/ai/geminiImageGeneration";

export type GenerateVariantSheetInput = {
  apiKey: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  sheetSize?: string;
  referenceImageBytes: Buffer;
  referenceMimeType: string;
  baseItemName: string;
};

export async function generateVariantSheetImage(
  input: GenerateVariantSheetInput,
): Promise<{ imageUrl: string; localPath: string; model: string }> {
  const mime = input.referenceMimeType || "image/png";
  const dataUrl = `data:${mime};base64,${input.referenceImageBytes.toString("base64")}`;
  const sheetSize = input.sheetSize ?? "2048x1024";

  const out = await generateGeminiImage({
    apiKey: input.apiKey,
    model: input.model,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    imageSize: sheetSize,
    itemName: `${input.baseItemName}_sheet`,
    referenceImageDataUrl: dataUrl,
  });

  return { imageUrl: out.imageUrl, localPath: out.localPath, model: out.model };
}

/** Mock：2×4 色块占位图 */
export async function generateMockVariantSheetImage(params: {
  baseItemName: string;
  sheetSize?: string;
}): Promise<{ imageUrl: string; localPath: string; model: string }> {
  const sharp = (await import("sharp")).default;
  const [wStr, hStr] = (params.sheetSize ?? "2048x1024").split("x");
  const width = Number(wStr) > 0 ? Number(wStr) : 2048;
  const height = Number(hStr) > 0 ? Number(hStr) : 1024;
  const cols = 4;
  const rows = 2;
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const colors = [
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#3498db",
    "#9b59b6",
    "#fd79a8",
    "#95a5a6",
  ];

  const composites: { input: Buffer; left: number; top: number }[] = [];
  for (let i = 0; i < 8; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tile = await sharp({
      create: { width: cellW - 8, height: cellH - 8, channels: 3, background: colors[i] },
    })
      .png()
      .toBuffer();
    composites.push({
      input: tile,
      left: col * cellW + 4,
      top: row * cellH + 4,
    });
  }

  const png = await sharp({
    create: { width, height, channels: 3, background: "#ffffff" },
  })
    .composite(composites)
    .png()
    .toBuffer();

  const { persistSheetBytes } = await import("@/lib/assets/splitVariantSheet");
  const saved = await persistSheetBytes(png, params.baseItemName);
  return { ...saved, model: "mock-sheet" };
}
