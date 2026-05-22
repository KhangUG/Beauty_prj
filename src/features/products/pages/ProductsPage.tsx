import { useState } from 'react'
import { RecommendationGrid } from '@/shared/components/ui/RecommendationGrid'
import { Loader } from '@/shared/components/ui/Loader'
import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'
import { type ProductRecommendation } from '@/shared/lib/types'
import { parseProductTags } from '@/shared/lib/product-tags'
import { Button } from '@/shared/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['catalog', 'products'],
    queryFn: async () => databaseService.getProducts(),
  })

  const [page, setPage] = useState(1)
  const itemsPerPage = 9

  const products: ProductRecommendation[] = (data ?? []).map((product) => {
    const parsed = parseProductTags(product)
    return {
      ...parsed,
      externalLink: product.external_url ?? '',
      reason: `Catalog pick for ${product.brand ?? 'general skincare'}.`,
    }
  })

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage))
  const paginated = products.slice((page - 1) * itemsPerPage, page * itemsPerPage)

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
          No products in the catalog. Please add new products from the admin page.
        </div>
      ) : (
        <>
          <RecommendationGrid products={paginated} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-sm font-semibold text-pearl">Page {page} of {totalPages}</span>
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
