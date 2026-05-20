export type SkinMetric = {
  label: string
  value: number
  status: 'great' | 'moderate' | 'attention'
}

export type ScanResult = {
  skinScore: number
  acne: SkinMetric
  hydration: SkinMetric
  oiliness: SkinMetric
  darkCircles: SkinMetric
}

export type ProductRecommendation = {
  id: string
  name: string
  image: string
  description: string
  reason: string
  externalLink: string
  category: string
}
