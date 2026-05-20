import { useMemo } from 'react'
import { AIResultCard } from '@/shared/components/ui/AIResultCard'
import { Card } from '@/shared/components/ui/Card'
import { Loader } from '@/shared/components/ui/Loader'
import { RecommendationGrid } from '@/shared/components/ui/RecommendationGrid'
import { mockScanResult } from '@/shared/data/mock-scan'
import { useRecommendations } from '@/features/recommendations/hooks/useRecommendations'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useScanHistory } from '@/features/recommendations/hooks/useScanHistory'

export default function RecommendationsPage() {
  const { data, isLoading } = useRecommendations()
  const { user } = useAuth()
  const historyQuery = useScanHistory(user?.id ?? 'guest-user')

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

  if (isLoading) {
    return <Loader fullScreen label="Generating recommendation matrix" />
  }

  return (
    <section className="section-shell space-y-8 pb-12">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan">Personalized Routine</p>
        <h1 className="mt-3 font-display text-4xl text-pearl md:text-5xl">AI Recommendation Deck</h1>
        <p className="mt-3 max-w-2xl text-mist">Product suggestions generated from your analysis profile with explainable rationale.</p>
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
        <p className="text-xs uppercase tracking-[0.24em] text-cyan">Recommended Products</p>
        <h2 className="mt-3 font-display text-3xl text-pearl">Precision-Matched Skincare</h2>
        <p className="mt-2 text-sm text-mist">Your routine balances hydration, blemish control, and under-eye brightness.</p>
        <div className="mt-6">
          <RecommendationGrid products={data ?? []} />
        </div>
      </Card>
    </section>
  )
}
