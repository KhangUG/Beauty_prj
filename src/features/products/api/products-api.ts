import { databaseService } from '@/services/supabase/database-service'

export async function fetchProducts() {
  await new Promise((resolve) => setTimeout(resolve, 250))
  try {
    const products = await databaseService.getProducts()
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image_url,
      description: product.description,
      reason: `Catalog pick tagged for ${product.tags.join(', ') || 'general skincare'}.`,
      externalLink: product.external_url,
      category: product.tags[0] ?? 'skincare',
    }))
  } catch {
    return []
  }
}
