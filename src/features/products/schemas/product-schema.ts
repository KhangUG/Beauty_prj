import { z } from 'zod'

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().url(),
  description: z.string(),
  reason: z.string(),
  externalLink: z.string().url(),
  category: z.string(),
})

export type ProductSchema = z.infer<typeof productSchema>
