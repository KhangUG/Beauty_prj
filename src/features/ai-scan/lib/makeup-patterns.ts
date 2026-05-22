import type { MakeupEffect, MakeupPalette } from '@/features/ai-scan/types/makeup-vto'

export type PatternCatalogItem = {
  category: string
  label: string
  thumbnail: string
  colorNum?: number
}

function readCategory(raw: Record<string, unknown>): string {
  const value = raw.category
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePatternItem(raw: Record<string, unknown>): PatternCatalogItem {
  const label = String(raw.label ?? raw.name ?? '')
  const colorNumRaw = raw.colorNum ?? raw.color_num
  const parsed =
    typeof colorNumRaw === 'number'
      ? colorNumRaw
      : typeof colorNumRaw === 'string'
        ? Number(colorNumRaw)
        : undefined

  return {
    category: readCategory(raw),
    label,
    thumbnail: String(raw.thumbnail ?? raw.thumb ?? ''),
    colorNum: Number.isFinite(parsed) && parsed! > 0 ? parsed : inferColorCountFromLabel(label),
  }
}

export function isColorPatternCategory(category?: string) {
  return Boolean(category && COLOR_PATTERN_CATEGORIES.has(category))
}

/** e.g. "2colors1" → 2, "3colors2" → 3, "1color2" → 1 */
export function inferColorCountFromLabel(label?: string): number {
  if (!label) return 1
  const colorsMatch = label.match(/(\d+)\s*colors?/i)
  if (colorsMatch) return clampColorCount(Number(colorsMatch[1]))
  const colorMatch = label.match(/^(\d+)color/i)
  if (colorMatch) return clampColorCount(Number(colorMatch[1]))
  return 1
}

function clampColorCount(value: number) {
  return Math.min(3, Math.max(1, value))
}

export function getPatternColorCount(label?: string, item?: PatternCatalogItem): number {
  if (item?.colorNum && item.colorNum > 0) return clampColorCount(item.colorNum)
  return inferColorCountFromLabel(label)
}

const CATALOG_URLS: Record<string, string> = {
  blush: 'https://plugins-media.makeupar.com/wcm-saas/patterns/blush.json',
  bronzer: 'https://plugins-media.makeupar.com/wcm-saas/patterns/bronzer.json',
  contour: 'https://plugins-media.makeupar.com/wcm-saas/patterns/contour.json',
  eye_liner: 'https://plugins-media.makeupar.com/wcm-saas/patterns/eyeliner.json',
  eye_shadow: 'https://plugins-media.makeupar.com/wcm-saas/patterns/eyeshadow.json',
  eyebrows: 'https://plugins-media.makeupar.com/wcm-saas/patterns/eyebrows.json',
  eyelashes: 'https://plugins-media.makeupar.com/wcm-saas/patterns/eyelashes.json',
  highlighter: 'https://plugins-media.makeupar.com/wcm-saas/patterns/highlighter.json',
  lip_liner: 'https://plugins-media.makeupar.com/wcm-saas/patterns/lipliner.json',
  lip_color: 'https://plugins-media.makeupar.com/wcm-saas/shapes/lipshape.json',
}

export const CATALOG_CACHE_VERSION = 3
const catalogCache = new Map<string, { version: number; data: PatternCatalogItem[] }>()

export const COLOR_PATTERN_CATEGORIES = new Set([
  'blush',
  'bronzer',
  'eye_shadow',
  'eye_liner',
  'eyelashes',
])

const COLOR_TAB_ORDER = ['1 color', '2 colors', '3 colors'] as const

const COLOR_TAB_BY_NUM: Record<number, string> = {
  1: '1 color',
  2: '2 colors',
  3: '3 colors',
}

export function hasPatternCatalog(category: string) {
  return Boolean(CATALOG_URLS[category])
}

export async function fetchPatternCatalog(category: string): Promise<PatternCatalogItem[]> {
  const cached = catalogCache.get(category)
  if (cached?.version === CATALOG_CACHE_VERSION) {
    return cached.data
  }

  const url = CATALOG_URLS[category]
  if (!url) return []

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not load patterns for ${category}`)
  const json = (await response.json()) as unknown
  const raw = Array.isArray(json)
    ? json
    : ((json as { data?: unknown[] }).data ?? (json as { patterns?: unknown[] }).patterns ?? [])
  const data = (raw as Record<string, unknown>[]).map(normalizePatternItem)
  catalogCache.set(category, { version: CATALOG_CACHE_VERSION, data })
  return data
}

export function findPatternItem(catalog: PatternCatalogItem[], label?: string) {
  if (!label) return undefined
  return catalog.find((item) => item.label === label)
}

function resolveColorTabName(item: PatternCatalogItem): (typeof COLOR_TAB_ORDER)[number] {
  const fromApi = item.category?.trim()
  if (fromApi && (COLOR_TAB_ORDER as readonly string[]).includes(fromApi)) {
    return fromApi as (typeof COLOR_TAB_ORDER)[number]
  }
  return (COLOR_TAB_BY_NUM[getPatternColorCount(item.label, item)] ?? '1 color') as (typeof COLOR_TAB_ORDER)[number]
}

function getColorPatternTabGroups(catalog: PatternCatalogItem[]) {
  const buckets: Record<(typeof COLOR_TAB_ORDER)[number], PatternCatalogItem[]> = {
    '1 color': [],
    '2 colors': [],
    '3 colors': [],
  }

  for (const item of catalog) {
    buckets[resolveColorTabName(item)].push(item)
  }

  return COLOR_TAB_ORDER.map((name) => ({ name, items: buckets[name] })).filter((tab) => tab.items.length > 0)
}

export function getPatternTabGroups(catalog: PatternCatalogItem[], effectCategory?: string) {
  if (!catalog.length) return []

  if (isColorPatternCategory(effectCategory)) {
    return getColorPatternTabGroups(catalog)
  }

  const groups = new Map<string, PatternCatalogItem[]>()
  for (const item of catalog) {
    const key = item.category?.trim() || 'All'
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, items]) => ({ name, items }))
}

const DEFAULT_PALETTE: MakeupPalette = {
  color: '#FF0000',
  texture: 'matte',
  colorIntensity: 50,
}

export function ensurePaletteCount(palettes: MakeupPalette[] | undefined, count: number): MakeupPalette[] {
  const next = [...(palettes ?? [])]
  while (next.length < count) {
    next.push({
      ...DEFAULT_PALETTE,
      color: count > 1 && next.length === 1 ? '#F2A53E' : DEFAULT_PALETTE.color,
    })
  }
  return next.slice(0, count)
}

export function applyPatternSelection(effect: MakeupEffect, pattern: PatternCatalogItem): MakeupEffect {
  const colorNum = getPatternColorCount(pattern.label, pattern)
  const isLipShape = effect.category === 'lip_color'

  if (isLipShape) {
    return {
      ...effect,
      shape: { name: pattern.label },
      palettes: ensurePaletteCount(effect.palettes, 1),
    }
  }

  return {
    ...effect,
    pattern: { ...effect.pattern, name: pattern.label },
    palettes: ensurePaletteCount(effect.palettes, colorNum),
  }
}

export function getActivePatternLabel(effect: MakeupEffect) {
  if (effect.category === 'lip_color') return effect.shape?.name
  return effect.pattern?.name
}

export function categoryNeedsPatternFirst(category: string) {
  return hasPatternCatalog(category)
}

export function isPatternChosen(effect: MakeupEffect) {
  return Boolean(getActivePatternLabel(effect)?.trim())
}

/** Reset pattern/palettes when user enables a category — colors appear only after picking a pattern. */
export function prepareEffectForEnable(effect: MakeupEffect): MakeupEffect {
  if (!categoryNeedsPatternFirst(effect.category)) {
    return { ...effect, enabled: true }
  }
  if (effect.category === 'lip_color') {
    return {
      ...effect,
      enabled: true,
      shape: undefined,
      palettes: undefined,
    }
  }
  if (effect.category === 'eyebrows') {
    return {
      ...effect,
      enabled: true,
      pattern: { type: 'shape' },
      palettes: undefined,
    }
  }
  return {
    ...effect,
    enabled: true,
    pattern: undefined,
    palettes: undefined,
  }
}

export function syncEffectPaletteCount(
  effect: MakeupEffect,
  catalog: PatternCatalogItem[],
): MakeupEffect {
  const label = getActivePatternLabel(effect)
  if (!label || !hasPatternCatalog(effect.category)) return effect
  const item = findPatternItem(catalog, label)
  const count = getPatternColorCount(label, item)
  const current = effect.palettes?.length ?? 0
  if (current === count) return effect
  return { ...effect, palettes: ensurePaletteCount(effect.palettes, count) }
}
