import { ScanProductGrid } from '@/shared/components/ui/ScanProductGrid'
import { mockProducts } from '@/shared/data/mock-products'

export default function ProductRecommendations() {
  const products = mockProducts.slice(0, 6)
  const featured = products[0]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600">Recommended</p>
          <h3 className="mt-2 font-display text-3xl font-extrabold text-rose-950">Curated Luxury Picks</h3>
          <p className="mt-2 max-w-2xl text-sm text-rose-700">Here is a temporary hardcoded reference layout so you can immediately see the product direction.</p>
        </div>
        {featured ? (
          <div className="hidden rounded-3xl border border-white/70 bg-white/80 p-4 shadow-lg lg:block lg:min-w-[280px]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-600">Hardcoded demo</p>
            <div className="mt-3 flex gap-4">
              <img src={featured.image} alt={featured.name} className="h-20 w-20 rounded-2xl object-cover" />
              <div>
                <p className="font-semibold text-rose-950">{featured.name}</p>
                <p className="mt-1 text-xs text-rose-700 line-clamp-2">{featured.reason}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[1.75rem] border border-white/40 bg-white/55 p-4 shadow-[0_24px_60px_rgba(255,192,203,0.12)] backdrop-blur-sm">
        <ScanProductGrid products={products} />
      </div>
    </div>
  )
}
