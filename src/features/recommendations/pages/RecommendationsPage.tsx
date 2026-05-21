
import { AIResultCard } from '@/shared/components/ui/AIResultCard'
import { Card } from '@/shared/components/ui/Card'
import { Loader } from '@/shared/components/ui/Loader'
import { RecommendationGrid } from '@/shared/components/ui/RecommendationGrid'
import { mockScanResult } from '@/shared/data/mock-scan'
import { mockProducts } from '@/shared/data/mock-products'
import { useRecommendations } from '@/features/recommendations/hooks/useRecommendations'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useScanHistory } from '@/features/recommendations/hooks/useScanHistory'
import { useMemo, useState } from 'react'
import { type ProductRecommendation } from '@/shared/lib/types'

export default function RecommendationsPage() {
  const { data, isLoading } = useRecommendations()
  const { user } = useAuth()
  const historyQuery = useScanHistory(user?.id ?? 'guest-user')
  const [sort, setSort] = useState<'match' | 'rating' | 'price'>('match')
  const [techView, setTechView] = useState(false)
  const [ctaVariant, setCtaVariant] = useState<'A' | 'B'>('A')

  const metrics = useMemo(
    () => [
      { metric: 'Skin Score', score: mockScanResult.skinScore, status: 'great' as const, insight: 'Premium skin quality potential with routine consistency.' },
      { metric: 'Acne Analysis', score: mockScanResult.acne.value, status: mockScanResult.acne.status, insight: 'Use gentle anti-inflammatory and barrier-safe formulas.' },
      { metric: 'Hydration Analysis', score: mockScanResult.hydration.value, status: mockScanResult.hydration.status, insight: 'Hydration baseline is good; lock with overnight emollients.' },
      { metric: 'Oiliness Analysis', score: mockScanResult.oiliness.value, status: mockScanResult.oiliness.status, insight: 'Balance sebum in T-zone with lightweight gel textures.' },
      { metric: 'Dark Circle Analysis', score: mockScanResult.darkCircles.value, status: mockScanResult.darkCircles.status, insight: 'Support microcirculation and eye-area moisture.' },
    ],
    [],
  )
  const productsList = useMemo(() => {
    const products: ProductRecommendation[] = (data && data.length ? data : mockProducts).map((p) => ({ ...p }))
    products.forEach((p) => {
      if (p.matchScore == null) {
        const ratingScore = (p.rating ?? 4) * 10
        const discountScore = p.discount ?? 0
        const scarcity = p.stock && p.stock <= 3 ? 8 : p.stock && p.stock <= 8 ? 4 : 0
        p.matchScore = Math.round(ratingScore + discountScore + scarcity)
        p.matchReason = p.reason
      }
    })

    if (sort === 'match') return products.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    if (sort === 'rating') return products.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === 'price') return products.sort((a, b) => {
      const pa = parseFloat((a.price ?? '$0').replace(/[^0-9.]/g, '')) || 0
      const pb = parseFloat((b.price ?? '$0').replace(/[^0-9.]/g, '')) || 0
      return pa - pb
    })

    return products
  }, [data, sort])

  if (isLoading) {
    return <Loader fullScreen label="Generating recommendation matrix" />
  }
  return (
    <section className="section-shell space-y-8 pb-12">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-rose-600">Personalized Routine</p>
        <h1 className="mt-3 font-display text-4xl text-pearl md:text-5xl">Personalized Recommendation Matrix</h1>
        <p className="mt-3 max-w-2xl text-mist">Products ranked by explainable match metrics — engineered to improve your skin score.</p>
        <p className="mt-2 text-xs text-mist">
          {historyQuery.isLoading
            ? 'Loading history...'
            : `Saved scans: ${(historyQuery.data ?? []).length}`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((item) => (
          <AIResultCard key={item.metric} metric={item.metric} score={item.score} status={item.status} insight={item.insight} />
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-rose-600">Recommended Products</p>
            <h2 className="mt-3 font-display text-3xl text-pearl">Precision-Matched Skincare</h2>
            <p className="mt-2 text-sm text-mist">Your routine balances hydration, blemish control, and under-eye brightness.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-rose-100 px-2 py-1 text-xs text-mist">
              <button onClick={() => setSort('match')} className={`px-2 py-1 rounded ${sort === 'match' ? 'bg-rose-600 text-white' : 'text-rose-600'}`}>Sort: Match</button>
              <button onClick={() => setSort('rating')} className={`px-2 py-1 rounded ${sort === 'rating' ? 'bg-rose-600 text-white' : 'text-rose-600'}`}>Rating</button>
              <button onClick={() => setSort('price')} className={`px-2 py-1 rounded ${sort === 'price' ? 'bg-rose-600 text-white' : 'text-rose-600'}`}>Price</button>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-rose-100 px-2 py-1 text-xs text-mist">
              <button onClick={() => setCtaVariant('A')} className={`px-2 py-1 rounded ${ctaVariant === 'A' ? 'bg-rose-600 text-white' : 'text-rose-600'}`}>CTA A</button>
              <button onClick={() => setCtaVariant('B')} className={`px-2 py-1 rounded ${ctaVariant === 'B' ? 'bg-rose-600 text-white' : 'text-rose-600'}`}>CTA B</button>
            </div>

            <button onClick={() => setTechView((s) => !s)} className="text-xs rounded-lg border border-rose-100 px-3 py-2 text-rose-600">{techView ? 'UI' : 'Tech'}</button>
          </div>
        </div>

        <div className="mt-6">
          <RecommendationGrid products={productsList} ctaVariant={ctaVariant} />
        </div>
        {techView ? (
          <div className="mt-4 rounded-lg border border-dashed border-rose-100 p-3 text-xs font-mono text-mist/80">
            <strong>Tech view:</strong> Products are ranked by a match score combining rating, discount uplift and scarcity signals. Match reasons are explainable per product.
          </div>
        ) : null}
      </Card>
    </section>
  )
}
