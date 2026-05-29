import type { GenerateItemsInput, GenerateItemsResult } from "@/types/ai";

type Candidate = GenerateItemsInput["candidateItems"][number];

function normKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function buildCandidateIndexes(candidates: Candidate[]) {
  const byId = new Map<string, Candidate>();
  const byName = new Map<string, Candidate>();
  const byItemId = new Map<number, Candidate>();

  for (const c of candidates) {
    byId.set(c.id, c);
    byName.set(normKey(c.name), c);
    if (c.itemId != null) byItemId.set(c.itemId, c);
  }

  return { byId, byName, byItemId };
}

function resolveCandidate(
  item: GenerateItemsResult["items"][number],
  indexes: ReturnType<typeof buildCandidateIndexes>,
): Candidate | undefined {
  const { byId, byName, byItemId } = indexes;

  if (item.catalogItemId) {
    const byPrimaryId = byId.get(item.catalogItemId);
    if (byPrimaryId) return byPrimaryId;
    const byAliasName = byName.get(normKey(item.catalogItemId));
    if (byAliasName) return byAliasName;
  }

  if (item.sourceItemId != null) {
    const byNumericId = byItemId.get(item.sourceItemId);
    if (byNumericId) return byNumericId;
  }

  const byItemName = byName.get(normKey(item.name));
  if (byItemName) return byItemName;

  if (item.displayName) {
    const byDisplay = byName.get(normKey(item.displayName));
    if (byDisplay) return byDisplay;
  }

  return undefined;
}

/** 将 Gemini 返回的 name/别名 纠正为道具库 cuid，并合并库内字段 */
export function normalizeGeneratedItemTable(
  result: GenerateItemsResult,
  candidates: GenerateItemsInput["candidateItems"],
  options: { useExistingCatalogOnly: boolean },
): GenerateItemsResult {
  if (candidates.length === 0) return result;

  const indexes = buildCandidateIndexes(candidates);
  const repairs: string[] = [];

  const items = result.items.map((item) => {
    const matched = resolveCandidate(item, indexes);

    if (matched) {
      if (item.catalogItemId && item.catalogItemId !== matched.id) {
        repairs.push(`「${item.catalogItemId}」已匹配道具库：${matched.name}（${matched.id}）`);
      }
      return {
        ...item,
        catalogItemId: matched.id,
        sourceItemId: matched.itemId ?? item.sourceItemId,
        name: matched.name,
        displayName: item.displayName ?? matched.name,
        category1: matched.category1,
        category2: matched.category2 ?? item.category2,
        color1: matched.color1 ?? item.color1,
        color2: matched.color2 ?? item.color2,
        shape: matched.shape ?? item.shape,
        size: matched.size ?? item.size,
        targetScale: matched.targetScale ?? item.targetScale,
        isNew: false,
      };
    }

    if (item.catalogItemId) {
      if (options.useExistingCatalogOnly) {
        repairs.push(`无法从道具库匹配「${item.catalogItemId}」/「${item.name}」，请检查主题或关闭「仅使用道具库」`);
        return item;
      }
      repairs.push(`「${item.catalogItemId}」未在道具库中找到，已标记为新建道具`);
      const { catalogItemId: _removed, ...rest } = item;
      return { ...rest, isNew: true };
    }

    if (!item.isNew && !options.useExistingCatalogOnly) {
      return { ...item, isNew: true };
    }

    return item;
  });

  const warnings = repairs.length > 0 ? [...result.warnings, ...repairs] : result.warnings;

  return { ...result, items, warnings };
}
