export type MakeupTexture =
  | "matte"
  | "satin"
  | "shimmer"
  | "gloss"
  | "metallic";

export type MakeupPalette = {
  color: string;
  texture?: MakeupTexture;
  colorIntensity?: number;
  colorUnderEyeIntensity?: number;
  coverageLevel?: number;
  coverageIntensity?: number;
  glowIntensity?: number;
  thickness?: number;
  smoothness?: number;
  shimmerDensity?: number;
  shimmerIntensity?: number;
  shimmerSize?: number;
};

export type MakeupEffect = {
  category: string;
  enabled?: boolean;
  pattern?: {
    name?: string;
    type?: string;
    curvature?: number;
    thickness?: number;
    definition?: number;
  };
  shape?: { name?: string };
  style?: { type?: string; innerRatio?: number; featherStrength?: number };
  morphology?: { fullness?: number; wrinkless?: number };
  palettes?: MakeupPalette[];
  skinSmoothStrength?: number;
  skinSmoothColorIntensity?: number;
};

export type MakeupVtoPayload = {
  src_file_url: string;
  effects: MakeupEffect[];
  version: "1.0";
};

export type MakeupVtoTaskStatus =
  | "idle"
  | "queued"
  | "running"
  | "processing"
  | "success"
  | "error";

export type MakeupCatalogItem = {
  productId: string;
  name: string;
  description: string | null;
  image: string;
  externalLink: string;
  brand: string | null;
  categoryId: string;
  categoryName: string;
  apiCategoryKey: string;
  hexColor: string | null;
  texture: string | null;
  colorIntensity: number | null;
  patternName: string | null;
};

export type MatchedMakeupProduct = MakeupCatalogItem & {
  matchReason: string;
  matchedCategory: string;
};
