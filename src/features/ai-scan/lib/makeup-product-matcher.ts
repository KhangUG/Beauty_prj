import type {
  MakeupEffect,
  MatchedMakeupProduct,
  MakeupCatalogItem,
} from "@/features/ai-scan/types/makeup-vto";

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function matchProductsToEffects(
  effects: MakeupEffect[],
  catalog: MakeupCatalogItem[],
): MatchedMakeupProduct[] {
  const activeEffects = effects.filter(
    (e) => e.enabled === true && e.category !== "skin_smooth",
  );

  const seen = new Set<string>();
  const matched: MatchedMakeupProduct[] = [];

  for (const effect of activeEffects) {
    const categoryKey = normalizeKey(effect.category);

    for (const item of catalog) {
      if (normalizeKey(item.apiCategoryKey) !== categoryKey) continue;
      if (seen.has(item.productId)) continue;
      seen.add(item.productId);

      matched.push({
        ...item,
        matchedCategory: effect.category,
        matchReason: "",
      });
    }
  }

  return matched;
}
