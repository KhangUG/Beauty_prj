import type { MakeupEffect } from '@/features/ai-scan/types/makeup-vto'

export const MAKEUP_CATEGORY_META: Record<
  string,
  { label: string; hasPattern?: boolean; hasTexture?: boolean; paletteCount?: number }
> = {
  skin_smooth: { label: 'Skin Smooth' },
  blush: { label: 'Blush', hasPattern: true, hasTexture: true, paletteCount: 1 },
  bronzer: { label: 'Bronzer', hasPattern: true, paletteCount: 1 },
  concealer: { label: 'Concealer', paletteCount: 1 },
  contour: { label: 'Contour', hasPattern: true, paletteCount: 1 },
  eye_liner: { label: 'Eye Liner', hasPattern: true, hasTexture: true, paletteCount: 1 },
  eye_shadow: { label: 'Eye Shadow', hasPattern: true, hasTexture: true, paletteCount: 1 },
  eyebrows: { label: 'Eyebrows', hasPattern: true, hasTexture: true, paletteCount: 1 },
  eyelashes: { label: 'Eyelashes', hasPattern: true, paletteCount: 1 },
  foundation: { label: 'Foundation', paletteCount: 1 },
  highlighter: { label: 'Highlighter', hasPattern: true, paletteCount: 1 },
  lip_color: { label: 'Lip Color', hasTexture: true, paletteCount: 1 },
  lip_liner: { label: 'Lip Liner', hasPattern: true, hasTexture: true, paletteCount: 1 },
}

export const SAMPLE_SELFIE_URLS = [
  'https://plugins-media.makeupar.com/strapi/assets/general_01_f8f1fd2225.png',
  'https://plugins-media.makeupar.com/strapi/assets/sample_Image_1_202b6bf6e6.jpg',
]

export const DEFAULT_MAKEUP_EFFECTS: MakeupEffect[] = [
  {
    category: 'blush',
    enabled: true,
    pattern: { name: '1color2' },
    palettes: [{ color: '#FF0000', texture: 'matte', colorIntensity: 50 }],
  },
  {
    category: 'bronzer',
    enabled: true,
    pattern: { name: 'Bronzer2' },
    palettes: [{ color: '#9F7C50', colorIntensity: 50 }],
  },
  {
    category: 'concealer',
    enabled: true,
    palettes: [{ color: '#FBF5E9', colorIntensity: 50, colorUnderEyeIntensity: 50, coverageLevel: 50 }],
  },
  {
    category: 'contour',
    enabled: true,
    pattern: { name: 'HeartFace2' },
    palettes: [{ color: '#9F7C50', colorIntensity: 50 }],
  },
  {
    category: 'eye_liner',
    enabled: true,
    pattern: { name: 'Arabic3' },
    palettes: [{ color: '#000000', texture: 'matte', colorIntensity: 50 }],
  },
  {
    category: 'eye_shadow',
    enabled: true,
    pattern: { name: '1color2' },
    palettes: [{ color: '#FF0000', texture: 'matte', colorIntensity: 50 }],
  },
  {
    category: 'eyebrows',
    enabled: true,
    pattern: { type: 'shape', name: 'Arrow1', curvature: 50, thickness: 50, definition: 50 },
    palettes: [{ color: '#000000', colorIntensity: 50, texture: 'matte' }],
  },
  {
    category: 'eyelashes',
    enabled: true,
    pattern: { name: 'Artistic1' },
    palettes: [{ color: '#000000', colorIntensity: 50 }],
  },
  {
    category: 'foundation',
    enabled: true,
    palettes: [{ color: '#EAC595', colorIntensity: 50, coverageIntensity: 50, glowIntensity: 0 }],
  },
  {
    category: 'highlighter',
    enabled: true,
    pattern: { name: 'HeartFace4' },
    palettes: [{ color: '#FFF7F8', colorIntensity: 50, glowIntensity: 50 }],
  },
  {
    category: 'lip_color',
    enabled: true,
    shape: { name: 'heart-shaped' },
    style: { type: 'full' },
    morphology: { fullness: 0, wrinkless: 0 },
    palettes: [{ color: '#FF0000', texture: 'matte', colorIntensity: 50 }],
  },
  {
    category: 'lip_liner',
    enabled: true,
    pattern: { name: 'Large&Full1' },
    palettes: [{ color: '#FF0000', texture: 'matte', colorIntensity: 50, thickness: 50, smoothness: 50 }],
  },
  {
    category: 'skin_smooth',
    enabled: true,
    skinSmoothStrength: 50,
    skinSmoothColorIntensity: 50,
  },
]

export function stripEffectForApi(effect: MakeupEffect): MakeupEffect {
  const { enabled: _enabled, ...rest } = effect
  return rest
}

export function buildApiEffects(effects: MakeupEffect[]): MakeupEffect[] {
  return effects.filter((effect) => effect.enabled !== false).map(stripEffectForApi)
}
