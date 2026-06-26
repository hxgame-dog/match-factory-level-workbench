import { ITEM_GENERATION_CHUNK_SIZE } from "@/lib/items/itemGenerationLimits";
import type { GenerateItemsResult } from "@/types/ai";

export type GenerateItemTableParams = {
  setName: string;
  description: string;
  itemTypeCount: number;
  colorCount: number;
};

export type GenerateProgress = {
  phase: "batch" | "finalize";
  batchIndex: number;
  batchTotal: number;
  collected: number;
};

const stripColor = (name: string) =>
  name.replace(/_(red|orange|yellow|green|blue|purple|pink|gray)$/i, "");

/** 解析响应：函数超时/崩溃时平台返回非 JSON 文本，避免被吞成 “Unexpected token” */
export async function parseJsonResponse(response: Response): Promise<unknown> {
  const raw = await response.text();
  let payload: { success?: boolean; error?: string; data?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 200);
    if (response.status === 504 || /timeout/i.test(snippet)) {
      throw new Error(`请求超时（服务器 ${response.status}）：本批耗时过长，请稍后重试。原始信息：${snippet}`);
    }
    throw new Error(`服务器返回异常（${response.status}）：${snippet || "无响应内容"}`);
  }
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? `请求失败（${response.status}）`);
  }
  return payload.data;
}

/**
 * 客户端编排生成道具表：≤单批上限走单请求，超过则逐批调用并合并，规避函数超时。
 * onProgress 用于上报进度（批次 / 整理阶段）。
 */
export async function generateItemTableClient(
  params: GenerateItemTableParams,
  onProgress?: (p: GenerateProgress) => void,
): Promise<GenerateItemsResult> {
  const { setName, description, itemTypeCount, colorCount } = params;

  if (itemTypeCount <= ITEM_GENERATION_CHUNK_SIZE) {
    onProgress?.({ phase: "batch", batchIndex: 0, batchTotal: 1, collected: 0 });
    const response = await fetch("/api/ai/items/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setName, description, itemTypeCount, colorCount }),
    });
    return (await parseJsonResponse(response)) as GenerateItemsResult;
  }

  const batchTotal = Math.ceil(itemTypeCount / ITEM_GENERATION_CHUNK_SIZE);
  const mergedItems: GenerateItemsResult["items"] = [];
  const existingNames: string[] = [];
  const warnings: string[] = [
    `物品种类数 ${itemTypeCount} 较多，已分 ${batchTotal} 批生成（每批约 ${ITEM_GENERATION_CHUNK_SIZE} 种）`,
  ];
  let summary = "";

  for (let batchIndex = 0; batchIndex < batchTotal; batchIndex += 1) {
    onProgress?.({ phase: "batch", batchIndex, batchTotal, collected: mergedItems.length });
    const remaining = itemTypeCount - batchIndex * ITEM_GENERATION_CHUNK_SIZE;
    const chunkTypeCount = Math.min(ITEM_GENERATION_CHUNK_SIZE, remaining);

    const response = await fetch("/api/ai/items/generate-chunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setName,
        description,
        colorCount,
        chunkTypeCount,
        batchIndex,
        batchTotal,
        existingNames: existingNames.slice(-220),
      }),
    });
    const chunk = (await parseJsonResponse(response)) as GenerateItemsResult;
    if (!summary && chunk.summary) summary = chunk.summary;
    if (Array.isArray(chunk.warnings)) warnings.push(...chunk.warnings);

    for (const item of chunk.items) {
      const slug = stripColor(item.name);
      if (existingNames.includes(slug)) continue;
      existingNames.push(slug);
      mergedItems.push(item);
    }
  }

  onProgress?.({ phase: "finalize", batchIndex: batchTotal, batchTotal, collected: mergedItems.length });
  const finalizeResponse = await fetch("/api/ai/items/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemTypeCount, colorCount, summary, warnings, items: mergedItems }),
  });
  return (await parseJsonResponse(finalizeResponse)) as GenerateItemsResult;
}

/** 保存（或更新）道具集，返回道具集 id */
export async function saveGeneratedItemSet(
  args: GenerateItemTableParams & { result: GenerateItemsResult },
  existingId?: string | null,
): Promise<string> {
  const body = {
    name: args.setName,
    description: args.description,
    itemTypeCount: args.itemTypeCount,
    colorCount: args.colorCount,
    summary: args.result.summary,
    warnings: args.result.warnings,
    items: args.result.items,
  };
  const response = await fetch(
    existingId ? `/api/generated-item-sets/${existingId}` : "/api/generated-item-sets",
    {
      method: existingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = (await response.json()) as { success?: boolean; error?: string; data?: { id?: string } };
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "保存失败");
  }
  return payload.data?.id ?? existingId ?? "";
}
