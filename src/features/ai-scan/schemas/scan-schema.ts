import { z } from 'zod'

export const scanMetricSchema = z.object({
  label: z.string(),
  value: z.number().min(0).max(100),
  status: z.enum(['great', 'moderate', 'attention']),
})

export const scanResultSchema = z.object({
  skinScore: z.number().min(0).max(100),
  acne: scanMetricSchema,
  hydration: scanMetricSchema,
  oiliness: scanMetricSchema,
  darkCircles: scanMetricSchema,
})

export type ScanResultSchema = z.infer<typeof scanResultSchema>
