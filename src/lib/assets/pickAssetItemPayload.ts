/** 从道具/资源记录中摘出图片生成 API 所需字段，去掉 null 与多余属性 */
export function pickAssetItemPayload(item: Record<string, unknown>) {
  return {
    name: String(item.name),
    displayName: item.displayName != null ? String(item.displayName) : undefined,
    category1: String(item.category1),
    category2: item.category2 != null ? String(item.category2) : undefined,
    color1: item.color1 != null ? String(item.color1) : undefined,
    color2: item.color2 != null ? String(item.color2) : undefined,
    shape: item.shape != null ? String(item.shape) : undefined,
    size: item.size != null ? String(item.size) : undefined,
    pattern: item.pattern != null ? String(item.pattern) : undefined,
    role: item.role != null ? String(item.role) : undefined,
    count: typeof item.count === "number" ? item.count : undefined,
    generatedItemId: item.generatedItemId != null ? String(item.generatedItemId) : undefined,
    sourceItemId: typeof item.sourceItemId === "number" ? item.sourceItemId : undefined,
    catalogItemId: item.catalogItemId != null ? String(item.catalogItemId) : undefined,
  };
}
