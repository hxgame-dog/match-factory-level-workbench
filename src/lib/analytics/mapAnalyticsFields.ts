import { analyticsFieldAliases, normalizeHeader } from "./fieldAliases";

export function buildFieldMapping(
  detectedFields: string[],
  manualMapping?: Record<string, string>,
): { mapping: Record<string, string>; unmapped: string[] } {
  const mapping: Record<string, string> = {};
  const aliasToStandard = new Map<string, string>();
  Object.entries(analyticsFieldAliases).forEach(([standard, aliases]) => {
    aliases.forEach((alias) => aliasToStandard.set(normalizeHeader(alias), standard));
    aliasToStandard.set(normalizeHeader(standard), standard);
  });

  const unmapped: string[] = [];
  for (const original of detectedFields) {
    const norm = normalizeHeader(original);
    const manual = manualMapping?.[original];
    if (manual) {
      mapping[original] = manual;
      continue;
    }
    const standard = aliasToStandard.get(norm);
    if (standard) {
      mapping[original] = standard;
    } else {
      unmapped.push(original);
    }
  }
  return { mapping, unmapped };
}
