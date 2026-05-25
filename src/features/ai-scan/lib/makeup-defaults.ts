import type { MakeupEffect } from "@/features/ai-scan/types/makeup-vto";
import {
  categoryNeedsPatternFirst,
  isPatternChosen,
} from "@/features/ai-scan/lib/makeup-patterns";

export const MAKEUP_CATEGORY_META: Record<
  string,
  {
    label: string;
    hasPattern?: boolean;
    hasTexture?: boolean;
    paletteCount?: number;
  }
> = {
  skin_smooth: { label: "Skin Smooth" },
  blush: {
    label: "Blush",
    hasPattern: true,
    hasTexture: true,
    paletteCount: 1,
  },
  bronzer: { label: "Bronzer", hasPattern: true, paletteCount: 1 },
  concealer: { label: "Concealer", paletteCount: 1 },
  contour: { label: "Contour", hasPattern: true, paletteCount: 1 },
  eye_liner: {
    label: "Eye Liner",
    hasPattern: true,
    hasTexture: true,
    paletteCount: 1,
  },
  eye_shadow: {
    label: "Eye Shadow",
    hasPattern: true,
    hasTexture: true,
    paletteCount: 1,
  },
  eyebrows: {
    label: "Eyebrows",
    hasPattern: true,
    hasTexture: true,
    paletteCount: 1,
  },
  eyelashes: { label: "Eyelashes", hasPattern: true, paletteCount: 1 },
  foundation: { label: "Foundation", paletteCount: 1 },
  highlighter: { label: "Highlighter", hasPattern: true, paletteCount: 1 },
  lip_color: { label: "Lip Color", hasTexture: true, paletteCount: 1 },
  lip_liner: {
    label: "Lip Liner",
    hasPattern: true,
    hasTexture: true,
    paletteCount: 1,
  },
};

export type SampleSelfie = {
  id: string;
  thumbUrl: string;
  fullUrl: string;
};

export const SAMPLE_SELFIES: SampleSelfie[] = [
  {
    id: "1",
    thumbUrl:
      "https://plugins-media.makeupar.com/strapi/assets/thumbnail_general_01_f8f1fd2225.png",
    fullUrl:
      "https://plugins-media.makeupar.com/strapi/assets/general_01_f8f1fd2225.png",
  },
  {
    id: "2",
    thumbUrl:
      "https://plugins-media.makeupar.com/strapi/assets/thumbnail_general_02_2fe7709272.png",
    fullUrl:
      "https://plugins-media.makeupar.com/strapi/assets/general_02_2fe7709272.png",
  },
  {
    id: "3",
    thumbUrl:
      "https://plugins-media.makeupar.com/strapi/assets/thumbnail_general_03_61c348a4ab.png",
    fullUrl:
      "https://plugins-media.makeupar.com/strapi/assets/general_03_61c348a4ab.png",
  },
  {
    id: "4",
    thumbUrl:
      "https://plugins-media.makeupar.com/strapi/assets/thumbnail_general_04_e68f62b89d.png",
    fullUrl:
      "https://plugins-media.makeupar.com/strapi/assets/general_04_e68f62b89d.png",
  },
  {
    id: "5",
    thumbUrl:
      "https://plugins-media.makeupar.com/strapi/assets/thumbnail_general_05_63ad7f8c8e.png",
    fullUrl:
      "https://plugins-media.makeupar.com/strapi/assets/general_05_63ad7f8c8e.png",
  },
  {
    id: "6",
    thumbUrl:
      "https://plugins-media.makeupar.com/strapi/assets/thumbnail_general_06_40721739e8.png",
    fullUrl:
      "https://plugins-media.makeupar.com/strapi/assets/general_06_40721739e8.png",
  },
];

/** @deprecated use SAMPLE_SELFIES */
export const SAMPLE_SELFIE_URLS = SAMPLE_SELFIES.map(
  (sample) => sample.fullUrl,
);

export const DEFAULT_MAKEUP_EFFECTS: MakeupEffect[] = [
  { category: "blush", enabled: false },
  { category: "bronzer", enabled: false },
  {
    category: "concealer",
    enabled: false,
    palettes: [
      {
        color: "#FBF5E9",
        colorIntensity: 50,
        colorUnderEyeIntensity: 50,
        coverageLevel: 50,
      },
    ],
  },
  { category: "contour", enabled: false },
  { category: "eye_liner", enabled: false },
  { category: "eye_shadow", enabled: false },
  { category: "eyebrows", enabled: false },
  { category: "eyelashes", enabled: false },
  {
    category: "foundation",
    enabled: false,
    palettes: [
      {
        color: "#EAC595",
        colorIntensity: 50,
        coverageIntensity: 50,
        glowIntensity: 0,
      },
    ],
  },
  {
    category: "highlighter",
    enabled: false,
    palettes: [
      {
        color: "#FFFFFF",
        colorIntensity: 50,
        glowIntensity: 50,
        shimmerDensity: 50,
        shimmerIntensity: 50,
        shimmerSize: 50,
      },
    ],
  },
  {
    category: "lip_color",
    enabled: false,
    style: { type: "full" },
    morphology: { fullness: 0, wrinkless: 0 },
  },
  {
    category: "lip_liner",
    enabled: false,
    palettes: [
      {
        color: "#FF0000",
        texture: "matte",
        colorIntensity: 50,
        smoothness: 50,
        thickness: 50,
      },
    ],
  },
  {
    category: "skin_smooth",
    enabled: false,
    skinSmoothStrength: 50,
    skinSmoothColorIntensity: 50,
  },
];

export function stripEffectForApi(effect: MakeupEffect): MakeupEffect {
  const { enabled: _enabled, ...rest } = effect;
  if (rest.palettes) {
    rest.palettes = rest.palettes.filter((palette) =>
      Boolean(palette.color?.trim()),
    );
  }
  return rest;
}

export function buildApiEffects(effects: MakeupEffect[]): MakeupEffect[] {
  return effects
    .filter(
      (effect) => effect.enabled === true,
    )
    .map(stripEffectForApi)
    .filter((effect) => {
      if (effect.category === "skin_smooth") return true;
      if (
        categoryNeedsPatternFirst(effect.category) &&
        !isPatternChosen(effect)
      )
        return false;
      return (effect.palettes?.length ?? 0) > 0;
    });
}
