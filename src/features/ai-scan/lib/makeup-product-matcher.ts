import type { MakeupEffect, MatchedMakeupProduct, MakeupCatalogItem } from '@/features/ai-scan/types/makeup-vto'
import { MAKEUP_CATEGORY_META } from '@/features/ai-scan/lib/makeup-defaults'

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim()
  if (normalized.length !== 6) return null
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ] as const
}

function colorDistance(left: string, right: string) {
  const a = hexToRgb(left)
  const b = hexToRgb(right)
  if (!a || !b) return 999
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

export function matchProductsToEffects(
  effects: MakeupEffect[],
  catalog: MakeupCatalogItem[],
  limit = 12,
): MatchedMakeupProduct[] {
  const activeEffects = effects.filter((effect) => effect.enabled === true && effect.category !== 'skin_smooth')
  const matches: MatchedMakeupProduct[] = []

  for (const effect of activeEffects) {
    const palette = effect.palettes?.[0]
    const effectColor = palette?.color?.toUpperCase()
    const effectTexture = palette?.texture?.toLowerCase()
    const effectPattern = effect.pattern?.name?.toLowerCase()
    const categoryKey = normalizeKey(effect.category)

    const candidates = catalog.filter((item) => normalizeKey(item.apiCategoryKey) === categoryKey)

    for (const item of candidates) {
      let score = 40
      const reasons: string[] = [MAKEUP_CATEGORY_META[effect.category]?.label ?? effect.category]

      if (effectColor && item.hexColor) {
        const distance = colorDistance(effectColor, item.hexColor)
        const colorScore = Math.max(0, 50 - distance / 3)
        score += colorScore
        if (distance < 40) reasons.push('Color match')
      }

      if (effectTexture && item.texture && effectTexture === item.texture.toLowerCase()) {
        score += 12
        reasons.push(item.texture)
      }

      if (effectPattern && item.patternName && effectPattern === item.patternName.toLowerCase()) {
        score += 15
        reasons.push(item.patternName)
      }

      if (
        palette?.colorIntensity != null &&
        item.colorIntensity != null &&
        Math.abs(palette.colorIntensity - item.colorIntensity) <= 20
      ) {
        score += 8
        reasons.push('Intensity')
      }

      matches.push({
        ...item,
        matchScore: Math.round(score),
        matchReason: reasons.join(' · '),
        matchedCategory: effect.category,
      })
    }
  }

  const deduped = new Map<string, MatchedMakeupProduct>()
  for (const match of matches.sort((a, b) => b.matchScore - a.matchScore)) {
    const existing = deduped.get(match.productId)
    if (!existing || match.matchScore > existing.matchScore) {
      deduped.set(match.productId, match)
    }
  }

  return [...deduped.values()].sort((a, b) => b.matchScore - a.matchScore).slice(0, limit)
}
