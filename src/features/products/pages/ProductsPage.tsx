import { RecommendationGrid } from '@/shared/components/ui/RecommendationGrid'
import { mockProducts } from '@/shared/data/mock-products'

export default function ProductsPage() {
  return (
    <section className="section-shell space-y-6 pb-12">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan">Catalog</p>
        <h1 className="mt-3 font-display text-4xl text-pearl">AI Curated Product Library</h1>
      </div>
      <RecommendationGrid products={mockProducts} />
    </section>
  )
}
