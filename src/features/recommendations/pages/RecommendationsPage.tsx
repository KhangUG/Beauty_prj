import { Card } from '@/shared/components/ui/Card'
import { Loader } from '@/shared/components/ui/Loader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useScanHistory } from '@/features/recommendations/hooks/useScanHistory'
import { useState, useEffect } from 'react'
import { cn } from '@/shared/lib/cn'
import { X, Clock, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'
import { supabase } from '@/services/supabase/client'

function useScanRecommendations(scan: any) {
  const { data: catalogProducts } = useQuery({
    queryKey: ['catalog', 'products'],
    queryFn: async () => databaseService.getProducts(),
  })

  return useQuery({
    queryKey: ['scan-recommendations', scan?.id],
    enabled: !!scan,
    queryFn: async () => {
      if (!scan) return []

      // If it's a guest scan, get products from local storage/catalog
      if (!scan.user_id) {
        const recList = scan.recommendations ?? []
        const catalog = catalogProducts ?? []
        return recList.map((r: any) => {
          const product = catalog.find((p) => p.id === r.productId)
          return {
            id: r.id,
            reason: r.reason ?? 'Recommended product based on your try-on.',
            product: product ? {
              id: product.id,
              name: product.name,
              description: product.description,
              image_url: product.image_url,
              external_url: product.external_url,
              brand: product.brand,
            } : null,
          }
        }).filter((r: any) => r.product !== null)
      }

      // If logged in, fetch from Supabase
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          id,
          reason,
          product:products (
            id,
            name,
            description,
            image_url,
            external_url,
            brand
          )
        `)
        .eq('scan_id', scan.id)

      if (error) throw error
      return data ?? []
    },
  })
}

function renderEffectDetails(effect: any) {
  const details: { label: string; value: React.ReactNode }[] = []

  if (effect.palettes && effect.palettes.length > 0) {
    effect.palettes.forEach((p: any, i: number) => {
      const labelSuffix = effect.palettes.length > 1 ? ` #${i + 1}` : ''
      details.push({
        label: `Color${labelSuffix}`,
        value: (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-4 rounded-full border border-mist/20 shadow-sm"
              style={{ backgroundColor: p.color }}
            />
            <span className="font-mono text-[11px] uppercase text-rose-950 font-semibold">{p.color}</span>
          </div>
        ),
      })
      if (p.texture) {
        details.push({
          label: `Texture${labelSuffix}`,
          value: <span className="capitalize">{p.texture}</span>,
        })
      }
      if (p.colorIntensity != null) {
        details.push({
          label: `Color Intensity${labelSuffix}`,
          value: `${p.colorIntensity}%`,
        })
      }
      if (p.glowIntensity != null) {
        details.push({
          label: `Glow Intensity${labelSuffix}`,
          value: `${p.glowIntensity}%`,
        })
      }
      if (p.shimmerIntensity != null) {
        details.push({
          label: `Shimmer Intensity${labelSuffix}`,
          value: `${p.shimmerIntensity}%`,
        })
      }
    })
  }

  if (effect.pattern?.name) {
    details.push({
      label: 'Pattern',
      value: <span className="capitalize">{effect.pattern.name}</span>,
    })
  }
  if (effect.shape?.name) {
    details.push({
      label: 'Shape',
      value: <span className="capitalize">{effect.shape.name}</span>,
    })
  }
  if (effect.style?.type) {
    details.push({
      label: 'Style',
      value: <span className="capitalize">{effect.style.type}</span>,
    })
  }
  if (effect.skinSmoothStrength != null) {
    details.push({
      label: 'Smoothness Strength',
      value: `${effect.skinSmoothStrength}%`,
    })
  }

  if (details.length === 0) return null

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 text-xs border-t border-rose-100/40 pt-2">
      {details.map((d, index) => (
        <div key={index} className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase font-bold text-mist/60 tracking-wider">{d.label}</span>
          <span className="text-rose-950 font-semibold">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function ScanCard({ scan, onClick }: { scan: any; onClick: () => void }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 border border-rose-100 hover:border-rose-200 transition-all duration-300">
      {/* Before / After Images */}
      <div className="h-52 overflow-hidden relative grid grid-cols-2 divide-x divide-rose-100">
        <div className="relative h-full w-full bg-rose-50 overflow-hidden">
          {scan.original_image ? (
            <img
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={scan.original_image}
              alt="Before"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-mist">Before</div>
          )}
          <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white">
            Before
          </span>
        </div>
        <div className="relative h-full w-full bg-rose-50 overflow-hidden">
          {scan.image_url ? (
            <img
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={scan.image_url}
              alt="After"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-mist">After</div>
          )}
          <span className="absolute bottom-2 left-2 rounded-full bg-rose-600/80 px-2 py-0.5 text-[10px] font-semibold text-white">
            After
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-3 p-5 text-night">
        <div className="flex justify-between items-center">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-500 font-extrabold">
            Scan #{scan.id.slice(0, 8)}
          </p>
          <span className={cn(
            'text-[10px] font-bold rounded-lg px-2 py-0.5 border',
            scan.mode === 'api' 
              ? 'text-emerald-700 bg-emerald-50/50 border-emerald-100' 
              : 'text-rose-600 bg-rose-50/50 border-rose-100',
          )}>
            {scan.mode === 'api' ? 'API' : 'Demo'}
          </span>
        </div>

        <h3 className="font-display text-xs font-semibold text-mist">
          {new Date(scan.created_at).toLocaleString('en-US')}
        </h3>

        <div className="pt-3 mt-auto">
          <button
            onClick={onClick}
            className="w-full text-center text-xs font-display font-extrabold uppercase tracking-wider py-3 shadow-md text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:brightness-105 active:scale-[0.98] transition-all rounded-xl"
          >
            View Details
          </button>
        </div>
      </div>
    </Card>
  )
}

function RecommendedProductsList({ scan }: { scan: any }) {
  const { data: recs, isLoading } = useScanRecommendations(scan)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader label="Loading recommendations..." />
      </div>
    )
  }

  if (!recs || recs.length === 0) {
    return (
      <p className="text-xs text-mist py-4">No product recommendations found for this scan.</p>
    )
  }

  return (
    <div className="space-y-4">
      {recs.map((rec: any) => {
        const prod = rec.product
        if (!prod) return null
        return (
          <div key={rec.id} className="group relative rounded-2xl border border-rose-100 bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-rose-200 flex gap-3">
            {prod.image_url && (
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-rose-50 bg-rose-50/20">
                <img src={prod.image_url} className="w-full h-full object-cover" alt={prod.name} />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-500 block mb-0.5">
                  {prod.brand || 'Skincare'}
                </span>
                <h4 className="font-display text-xs font-bold text-rose-950 truncate leading-tight">
                  {prod.name}
                </h4>
                <p className="text-[10px] text-mist/95 line-clamp-2 mt-1 leading-snug">
                  {prod.description}
                </p>
              </div>

              {prod.external_url && (
                <div className="mt-2.5 pt-2 border-t border-rose-50 flex items-center justify-between">
                  <a
                    href={prod.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 transition"
                  >
                    Buy now
                  </a>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScanDetailModal({ scan, onClose }: { scan: any; onClose: () => void }) {
  const enabledEffects = (scan.effects ?? []).filter((e: any) => e.enabled)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, lightboxImage])

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-rose-100/60 bg-white shadow-2xl flex flex-col max-h-[90vh]">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-10 rounded-full p-2 text-mist bg-white/90 hover:bg-rose-50 hover:text-rose-600 transition shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-rose-100 overflow-y-auto flex-1">
            {/* Left Side: Images (Wider Span) */}
            <div className="lg:col-span-5 p-6 md:p-8 space-y-4">
              <h3 className="font-display text-lg font-bold text-rose-950">Visual Comparison</h3>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className="relative rounded-2xl overflow-hidden bg-rose-50 border border-rose-100 aspect-[3/4] cursor-zoom-in hover:brightness-95 transition"
                  onClick={() => scan.original_image && setLightboxImage(scan.original_image)}
                >
                  {scan.original_image ? (
                    <img src={scan.original_image} className="h-full w-full object-cover" alt="Before" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-mist">Before</div>
                  )}
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-semibold text-white">Before</span>
                </div>
                <div 
                  className="relative rounded-2xl overflow-hidden bg-rose-50 border border-rose-100 aspect-[3/4] cursor-zoom-in hover:brightness-95 transition"
                  onClick={() => scan.image_url && setLightboxImage(scan.image_url)}
                >
                  {scan.image_url ? (
                    <img src={scan.image_url} className="h-full w-full object-cover" alt="After" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-mist">After</div>
                  )}
                  <span className="absolute bottom-3 left-3 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-semibold text-white">After</span>
                </div>
              </div>
              {scan.image_url && (
                <a
                  href={scan.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-100 py-3 text-sm font-medium text-rose-700 bg-rose-50/50 hover:bg-rose-50 transition no-underline shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Download Result Image
                </a>
              )}
            </div>

            {/* Middle Side: Details & Effects */}
            <div className="lg:col-span-4 p-6 md:p-8 space-y-6 overflow-y-auto">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-cyan">Scan Details</p>
                <h2 className="mt-1 font-display text-2xl text-rose-950 font-extrabold">Metadata & Effects</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-rose-50/30 border border-rose-100/50 p-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-mist/60 block">Scan ID</span>
                  <span className="font-mono text-xs text-rose-950 font-semibold break-all">{scan.id}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-mist/60 block">Mode</span>
                  <span className={cn(
                    'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border mt-0.5 uppercase',
                    scan.mode === 'api' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100',
                  )}>
                    {scan.mode === 'api' ? 'API' : 'Demo'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-mist/60 block">Captured Date</span>
                  <div className="flex items-center gap-2 text-xs text-rose-950 font-medium mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-mist" />
                    {new Date(scan.created_at).toLocaleString('en-US')}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase font-bold tracking-widest text-mist mb-3">Applied Makeup Effects</h3>
                {enabledEffects.length === 0 ? (
                  <p className="text-xs text-mist">No makeup effects were active for this scan.</p>
                ) : (
                  <div className="space-y-4">
                    {enabledEffects.map((e: any) => (
                      <div key={e.category} className="rounded-2xl border border-rose-100/60 bg-rose-50/20 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold capitalize text-rose-950">
                            {e.category.replace('_', ' ')}
                          </span>
                          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                            Active
                          </span>
                        </div>
                        {renderEffectDetails(e)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Recommendations */}
            <div className="lg:col-span-3 p-6 md:p-8 space-y-6 overflow-y-auto">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-cyan">AI Curated</p>
                <h3 className="mt-1 font-display text-xl font-extrabold text-rose-950">Recommendations</h3>
              </div>
              <RecommendedProductsList scan={scan} />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for full screen viewing */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute right-6 top-6 z-[110] rounded-full p-2 text-white bg-white/10 hover:bg-white/20 transition"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-fade-in"
            alt="Enlarged view"
          />
        </div>
      )}
    </>
  )
}

export default function RecommendationsPage() {
  const { user } = useAuth()
  const historyQuery = useScanHistory(user?.id)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [selectedScan, setSelectedScan] = useState<any>(null)
  const [page, setPage] = useState(1)
  const itemsPerPage = 9

  const scans = historyQuery.data ?? []
  
  const sorted = [...scans].sort((a: any, b: any) => {
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage))
  const paginated = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  useEffect(() => {
    setPage(1)
  }, [sortBy])

  if (historyQuery.isLoading) {
    return <Loader fullScreen label="Loading scan history" />
  }

  return (
    <section className="section-shell space-y-6 pb-12">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan">Scan History</p>
        <h1 className="mt-3 font-display text-4xl text-pearl">Makeup Try-On History</h1>
        <p className="mt-2 text-sm text-mist">Review your previous makeup try-on scans.</p>
      </div>

      {/* Sorting bar */}
      <div className="flex items-center justify-between border-b border-rose-100/40 pb-4">
        <span className="text-xs text-mist">{scans.length} scans found</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-mist font-semibold">Sort by:</span>
          {(['newest', 'oldest'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-semibold transition capitalize',
                sortBy === s
                  ? 'border-cyan/40 bg-cyan/10 text-cyan'
                  : 'border-rose-100/60 text-mist bg-white/50 hover:bg-white',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of scans */}
      {sorted.length === 0 ? (
        <div className="rounded-[2rem] border border-rose-100/60 bg-white/80 p-12 text-center text-sm text-mist">
          No scans yet. Try on makeup to save your history.
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((scan: any, index: number) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: (index % itemsPerPage) * 0.06, duration: 0.4 }}
              >
                <ScanCard scan={scan} onClick={() => setSelectedScan(scan)} />
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-sm font-semibold text-pearl">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {selectedScan && (
        <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
      )}
    </section>
  )
}
