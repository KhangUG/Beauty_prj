import { RecommendationGrid } from '@/shared/components/ui/RecommendationGrid'
import { Loader } from '@/shared/components/ui/Loader'
import { mockProducts } from '@/shared/data/mock-products'
import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'
import { type ProductRecommendation } from '@/shared/lib/types'

export default function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['catalog', 'products'],
    queryFn: async () => databaseService.getProducts(),
  })

  const products: ProductRecommendation[] = (data && data.length
    ? data.map((product) => ({
        id: product.id,
        name: product.name,
        image: product.image_url,
        description: product.description,
        reason: `Catalog pick tagged for ${product.tags.join(', ') || 'general skincare'}.`,
        externalLink: product.external_url,
        category: product.tags[0] ?? 'skincare',
      }))
    : mockProducts)

  if (isLoading) {
    return <Loader fullScreen label="Loading product catalog" />
  }

  return (
    <section className="section-shell space-y-6 pb-12">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan">Catalog</p>
        <h1 className="mt-3 font-display text-4xl text-pearl">AI Curated Product Library</h1>
      </div>
      <RecommendationGrid products={products} />
    </section>
  )
}
