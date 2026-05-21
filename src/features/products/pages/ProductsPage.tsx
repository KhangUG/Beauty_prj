import { RecommendationGrid } from '@/shared/components/ui/RecommendationGrid'
import { Loader } from '@/shared/components/ui/Loader'
import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'
import { type ProductRecommendation } from '@/shared/lib/types'
import { parseProductTags } from '@/shared/lib/product-tags'

export default function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['catalog', 'products'],
    queryFn: async () => databaseService.getProducts(),
  })

  const products: ProductRecommendation[] = (data ?? []).map((product) => {
    const parsed = parseProductTags(product)
    return {
      ...parsed,
      externalLink: product.external_url,
      reason: `Catalog pick tagged for ${parsed.cleanTags.join(', ') || 'general skincare'}.`,
    }
  })

  if (isLoading) {
    return <Loader fullScreen label="Loading product catalog" />
  }

  return (
    <section className="section-shell space-y-6 pb-12">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan">Catalog</p>
        <h1 className="mt-3 font-display text-4xl text-pearl">AI Curated Product Library</h1>
      </div>
      {products.length === 0 ? (
        <div className="rounded-[2rem] border border-rose-100/60 bg-white/80 p-12 text-center text-sm text-mist">
          Không có sản phẩm nào trong catalog. Vui lòng thêm sản phẩm mới từ trang quản trị.
        </div>
      ) : (
        <RecommendationGrid products={products} />
      )}
    </section>
  )
}
