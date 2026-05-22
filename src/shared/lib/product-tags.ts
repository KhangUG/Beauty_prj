import { type ProductRecommendation } from '@/shared/lib/types'
import { type AdminProductRecord } from '@/services/supabase/database-service'

export interface ParsedProduct extends Omit<ProductRecommendation, 'reason' | 'externalLink'> {
  originalTags: string[]
  cleanTags: string[]
}

export function parseProductTags(product: AdminProductRecord & { tags?: string[] }): ParsedProduct {
  const tags = product.tags ?? []
  let category = 'Skincare'
  let price = ''
  let originalPrice = ''
  let discount: number | undefined = undefined
  let stock: number | undefined = undefined
  let rating = 4.5
  let reviews = 24
  const cleanTags: string[] = []

  // Try to find category from the first tag that is not a special metadata tag
  let foundFirstPlainTag = false

  for (const tag of tags) {
    const trimmed = tag.trim()
    if (trimmed.startsWith('cat:')) {
      category = trimmed.substring(4).trim()
    } else if (trimmed.startsWith('price:')) {
      const val = trimmed.substring(6).trim()
      price = val.startsWith('$') ? val : `$${val}`
    } else if (trimmed.startsWith('orig:')) {
      const val = trimmed.substring(5).trim()
      originalPrice = val.startsWith('$') ? val : `$${val}`
    } else if (trimmed.startsWith('disc:')) {
      discount = parseInt(trimmed.substring(5).trim(), 10) || undefined
    } else if (trimmed.startsWith('stock:')) {
      stock = parseInt(trimmed.substring(6).trim(), 10) || undefined
    } else if (trimmed.startsWith('rate:')) {
      rating = parseFloat(trimmed.substring(5).trim()) || 4.5
    } else if (trimmed.startsWith('rev:')) {
      reviews = parseInt(trimmed.substring(4).trim(), 10) || 24
    } else {
      cleanTags.push(trimmed)
      if (!foundFirstPlainTag) {
        category = trimmed
        foundFirstPlainTag = true
      }
    }
  }

  // Capitalize category
  if (category) {
    category = category.charAt(0).toUpperCase() + category.slice(1)
  }

  return {
    id: product.id,
    name: product.name,
    image: product.image_url ?? '',
    description: product.description ?? '',
    category,
    price,
    originalPrice,
    discount,
    stock,
    rating,
    reviews,
    originalTags: tags,
    cleanTags,
  }
}

export function encodeProductTags(params: {
  tags: string[]
  category: string
}): string[] {
  // Filter out any existing metadata tags
  const cleanTags = params.tags.filter(
    (tag) =>
      !tag.startsWith('cat:') &&
      !tag.startsWith('price:') &&
      !tag.startsWith('orig:') &&
      !tag.startsWith('disc:') &&
      !tag.startsWith('stock:') &&
      !tag.startsWith('rate:') &&
      !tag.startsWith('rev:'),
  )

  const metadataTags: string[] = []
  if (params.category) {
    metadataTags.push(`cat:${params.category.trim()}`)
  }

  return [...cleanTags, ...metadataTags]
}
