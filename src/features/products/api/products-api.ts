import { databaseService } from '@/services/supabase/database-service'

export async function fetchProducts() {
  await new Promise((resolve) => setTimeout(resolve, 250))
  try {
    const products = await databaseService.getProducts()
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image_url ?? '',
      description: product.description ?? '',
      reason: `Catalog pick for ${product.brand ?? 'skincare'}.`,
      externalLink: product.external_url ?? '',
      category: product.brand ?? 'skincare',
    }))
  } catch {
    return []
  }
}
