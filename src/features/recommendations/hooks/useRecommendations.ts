import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations', 'products'],
    queryFn: async () => {
      const products = await databaseService.getProducts()
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        image: product.image_url,
        description: product.description,
        externalLink: product.external_url,
        category: product.tags[0] ?? 'skincare',
        reason: `Recommended for balanced routine support in ${product.tags.join(', ')}.`,
      }))
    },
  })
}
