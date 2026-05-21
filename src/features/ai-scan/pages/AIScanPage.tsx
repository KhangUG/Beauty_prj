import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/shared/hooks/useToast'
import { AIResultCard } from '@/shared/components/ui/AIResultCard'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Modal } from '@/shared/components/ui/Modal'
import { useScanStore } from '@/features/ai-scan/store/scan-store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { persistScan } from '@/features/ai-scan/services/scan-persistence-service'
import { useUIStore } from '@/store/ui-store'
import { useRecommendations } from '@/features/recommendations/hooks/useRecommendations'
import { useScanHistory } from '@/features/recommendations/hooks/useScanHistory'
import { ScanProductGrid } from '@/shared/components/ui/ScanProductGrid'
import { type ProductRecommendation, type ScanResult } from '@/shared/lib/types'

const scanMessages = [
  'Calibrating light map...',
  'Detecting texture signatures...',
  'Estimating hydration and sebum trends...',
  'Matching ingredients to skin profile...',
]

type RankedRecommendation = ProductRecommendation & {
  matchScore: number
  matchReason: string
}

function rankRecommendations(products: ProductRecommendation[], scanResult: ScanResult | null): RankedRecommendation[] {
  if (!scanResult) {
    return products.map((product) => ({ ...product, matchScore: 0, matchReason: 'Awaiting scan results' }))
  }

  return products
    .map((product) => {
      const text = `${product.category} ${product.name} ${product.description} ${product.reason}`.toLowerCase()
      let matchScore = 10
      const reasons: string[] = []

      const hydrationKeywords = ['serum', 'moisturizer', 'essence', 'barrier', 'peptide']
      const acneKeywords = ['cleanser', 'niacinamide', 'probiotic', 'toner', 'treatment']
      const oilinessKeywords = ['cleanser', 'toner', 'niacinamide', 'probiotic', 'sunscreen']
      const darkCircleKeywords = ['eye', 'mask', 'vitamin c', 'peptide', 'brighten']

      if (scanResult.hydration.status !== 'great' && hydrationKeywords.some((keyword) => text.includes(keyword))) {
        matchScore += 22
        reasons.push('Hydration support')
      }

      if ((scanResult.acne.status === 'moderate' || scanResult.acne.status === 'attention') && acneKeywords.some((keyword) => text.includes(keyword))) {
        matchScore += 20
        reasons.push('Breakout control')
      }

      if ((scanResult.oiliness.status === 'moderate' || scanResult.oiliness.status === 'attention') && oilinessKeywords.some((keyword) => text.includes(keyword))) {
        matchScore += 16
        reasons.push('Oil-balance')
      }

      if ((scanResult.darkCircles.status === 'moderate' || scanResult.darkCircles.status === 'attention') && darkCircleKeywords.some((keyword) => text.includes(keyword))) {
        matchScore += 24
        reasons.push('Under-eye recovery')
      }

      if (scanResult.skinScore < 90 && ['serum', 'mask', 'treatment', 'moisturizer'].some((keyword) => text.includes(keyword))) {
        matchScore += 8
        reasons.push('Overall skin support')
      }

      if (product.category.toLowerCase().includes('sunscreen') && scanResult.skinScore >= 80) {
        matchScore += 10
        reasons.push('Protect current progress')
      }

      if (scanResult.hydration.status === 'great' && hydrationKeywords.some((keyword) => text.includes(keyword))) {
        matchScore += 10
        reasons.push('Maintain glow')
      }

      return {
        ...product,
        matchScore,
        matchReason: reasons.length > 0 ? reasons.join(' · ') : 'General routine support',
      }
    })
    .sort((left, right) => right.matchScore - left.matchScore)
}

function buildRecommendationSummary(scanResult: ScanResult | null) {
  if (!scanResult) return 'Run a scan to unlock matched skincare.'

  const notes: string[] = []

  if (scanResult.darkCircles.status !== 'great') notes.push('under-eye recovery')
  if (scanResult.oiliness.status !== 'great') notes.push('oil balance')
  if (scanResult.acne.status !== 'great') notes.push('barrier support')
  if (scanResult.hydration.status !== 'great') notes.push('hydration support')

  if (notes.length === 0) {
    return 'Your scan looks balanced — these picks are focused on maintaining glow and protection.'
  }

  return `Top matches are tuned for ${notes.join(', ')}.`
}

export default function AIScanPage() {
  const { phase, imagePreview, scanResult, setImagePreview, runFakeScan, reset } = useScanStore()
  const { user, subscriptionTier } = useAuth()
  const hasSeenScanOnboarding = useUIStore((state) => state.hasSeenScanOnboarding)
  const markScanOnboardingSeen = useUIStore((state) => state.markScanOnboardingSeen)
  const [webcamOpen, setWebcamOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenScanOnboarding)
  const [showPaywall, setShowPaywall] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const { data: recommendedProducts, isLoading: loadingProducts } = useRecommendations()
  const displayProducts = recommendedProducts ?? []
  const rankedProducts = useMemo(() => rankRecommendations(displayProducts, scanResult), [displayProducts, scanResult])
  const recommendationSummary = useMemo(() => buildRecommendationSummary(scanResult), [scanResult])

  const scanHistoryQuery = useScanHistory(user?.id)
  const plan = subscriptionTier?.toLowerCase() || 'free'
  const quotaByPlan: Record<string, number> = {
    free: 2,
    premium: 10,
    pro: 25,
  }
  const maxFreeScans = quotaByPlan[plan] ?? quotaByPlan.free
  const scansUsed = scanHistoryQuery.data?.length ?? 0
  const canScan = scansUsed < maxFreeScans
  const remainingFreeScans = Math.max(0, maxFreeScans - scansUsed)

  const toast = useToast()

  const persistMutation = useMutation({
    mutationFn: async () => {
      if (!scanResult) return null
      const userId = user?.id ?? ''
      return persistScan(userId, scanResult)
    },
    onSuccess: () => {
      toast.success('Scan saved')
    },
    onError: () => {
      toast.error('Save failed')
    },
  })

  useEffect(() => {
    const setupCamera = async () => {
      if (!webcamOpen) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraError(null)
      } catch {
        setCameraError('Camera access denied. Please allow webcam permission or upload a selfie.')
        setWebcamOpen(false)
      }
    }

    void setupCamera()

    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }, [webcamOpen])

  const statusText = useMemo(() => {
    if (phase === 'idle') return 'Upload selfie or start webcam simulation to begin.'
    if (phase === 'uploading') return 'Image received. Ready to launch AI skin scan.'
    if (phase === 'scanning') return 'Analyzing skin layers and generating recommendations...'
    return 'Analysis complete. Explore your personalized routine.'
  }, [phase])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setWebcamOpen(false)
  }

  const captureFromWebcam = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const context = canvas.getContext('2d')

    if (!context) return

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    setImagePreview(canvas.toDataURL('image/jpeg', 0.92))
    setWebcamOpen(false)
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
  }

  useEffect(() => {
    if (phase === 'complete' && scanResult) {
      if (persistMutation.isPending || persistMutation.isSuccess || persistMutation.isError) {
        return
      }

      persistMutation.mutate()
    }
  }, [phase, scanResult, persistMutation, persistMutation.isError, persistMutation.isPending, persistMutation.isSuccess])

  // Dev helper: open `/scan?demo=1` to auto-populate a demo selfie and run the fake scan
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('demo') === '1') {
        if (scanHistoryQuery.isLoading) return
        setImagePreview('/demo-products/serum.svg')
        if (canScan) {
          void runFakeScan()
        } else {
          setShowPaywall(true)
        }
      }
    } catch {
      // ignore
    }
  }, [setImagePreview, runFakeScan, canScan, scanHistoryQuery.isLoading])

  const handleRunScan = () => {
    if (!canScan) {
      setShowPaywall(true)
      return
    }
    void runFakeScan()
  }

  return (
    <section className="section-shell pb-20 pt-4">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <motion.div
          className="rounded-[2rem] border border-rose-100/50 bg-[linear-gradient(180deg,rgba(255,250,250,0.98),rgba(255,245,246,0.9))] p-6 shadow-[0_20px_60px_rgba(230,155,170,0.06)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 18, scale: 0.992 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-rose-600">AI Scan Studio</p>
              <h1 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] text-pearl md:text-5xl">
                Skin Intelligence Capture
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist md:text-base">
                Upload a selfie or use webcam to generate a calm, polished skin analysis with matched products below.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                ['Upload', 'Selfie or webcam'],
                ['Analyze', 'Texture and hydration'],
                ['Recommend', 'Matched routine'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl border border-rose-100/60 bg-white/80 p-3 text-left shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-rose-600">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-mist">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[0.88fr,1.12fr]">
          <Card className="overflow-hidden border border-rose-100/50 bg-[linear-gradient(180deg,rgba(255,250,250,0.96),rgba(255,245,246,0.9))] p-0 shadow-[0_18px_50px_rgba(230,155,170,0.06)]">
            <div className="border-b border-rose-100/50 bg-[linear-gradient(180deg,rgba(255,250,250,0.98),rgba(255,245,246,0.92))] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-rose-600">Capture</p>
              <p className="mt-1 text-sm leading-relaxed text-mist">Choose a source and run the scan when you’re ready.</p>
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-rose-200/70 bg-white/75 px-4 py-3 text-sm text-mist transition hover:border-rose-300 hover:bg-white">
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">✦</span>
                    Upload Selfie
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-rose-400">File</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setWebcamOpen(true)}>
                    Webcam
                  </Button>
                  {webcamOpen ? (
                    <Button variant="ghost" size="sm" onClick={captureFromWebcam}>
                      Capture
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={handleRunScan}
                    disabled={!imagePreview || phase === 'scanning' || scanHistoryQuery.isLoading}
                  >
                    Run Scan
                  </Button>
                  <Button variant="accent" size="sm" onClick={reset}>
                    Reset
                  </Button>
                </div>

                {cameraError ? <p className="text-xs text-rose-400">{cameraError}</p> : null}
                {scanHistoryQuery.isLoading ? (
                  <p className="text-[11px] text-mist">Đang kiểm tra số lần quét...</p>
                ) : (
                  <p className="text-[11px] text-mist">
                    Gói {plan}: {maxFreeScans} lượt — còn {remainingFreeScans} lượt.
                  </p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-rose-100/50 bg-[linear-gradient(180deg,rgba(255,250,250,0.94),rgba(255,245,246,0.86))] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-rose-600">Scan status</p>
                  <span className="rounded-full border border-rose-100 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-500">
                    {phase}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-mist">{statusText}</p>
                {phase === 'scanning' ? (
                  <motion.div className="mt-4 space-y-2 rounded-2xl border border-rose-100/40 bg-white/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {scanMessages.map((message, index) => (
                      <motion.p
                        key={message}
                        className="text-[11px] text-mist"
                        initial={{ opacity: 0.15, x: -4 }}
                        animate={{ opacity: [0.25, 1, 0.35], x: [0, 3, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.35 }}
                      >
                        {message}
                      </motion.p>
                    ))}
                  </motion.div>
                ) : null}

                {phase === 'complete' ? (
                  <div className="mt-4 space-y-2">
                    <Link to="/recommendations" className="block">
                      <Button className="w-full" size="sm">
                        View Full Recommendations →
                      </Button>
                    </Link>
                    <p className="text-[10px] text-mist">{persistMutation.isPending ? 'Saving...' : null}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border border-rose-100/50 bg-[linear-gradient(180deg,rgba(255,250,250,0.96),rgba(255,245,246,0.9))] p-0 shadow-[0_18px_50px_rgba(230,155,170,0.06)]">
            <div className="border-b border-rose-100/50 bg-[linear-gradient(180deg,rgba(255,250,250,0.98),rgba(255,245,246,0.92))] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-rose-600">Analysis canvas</p>
              <p className="mt-1 text-sm leading-relaxed text-mist">Your uploaded image and result cards live here in a calm, editorial layout.</p>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-5 grid-cols-1 xl:grid-cols-[280px,1fr]">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-rose-100/40 bg-[linear-gradient(180deg,rgba(255,250,250,0.95),rgba(255,250,250,0.88))] shadow-sm">
                  <div className="border-b border-rose-100/40 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-400">Preview</p>
                  </div>
                  <div className="relative flex h-[18rem] sm:h-[24rem] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(254,215,222,0.08),transparent_38%),linear-gradient(180deg,rgba(255,250,250,0.84),rgba(255,245,246,0.92))]">
                    {webcamOpen ? (
                      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                    ) : imagePreview ? (
                      <img src={imagePreview} alt="Scan preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="space-y-2 px-6 text-center text-sm text-mist/65">
                        <p className="font-semibold text-mist/80">No image yet</p>
                        <p>Upload a selfie or open webcam to begin the scan.</p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(254,215,222,0.12),transparent_40%),linear-gradient(180deg,transparent,rgba(255,250,250,0.08))]" />
                  </div>
                </div>

                <div className="space-y-4">
                  {scanResult ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { metric: 'Skin Score', score: scanResult.skinScore, status: 'great' as const, insight: 'Overall quality' },
                        { metric: 'Acne', score: scanResult.acne.value, status: scanResult.acne.status, insight: 'Inflammation level' },
                        { metric: 'Hydration', score: scanResult.hydration.value, status: scanResult.hydration.status, insight: 'Moisture retention' },
                        { metric: 'Dark Circles', score: scanResult.darkCircles.value, status: scanResult.darkCircles.status, insight: 'Under-eye fatigue' },
                      ].map((item) => (
                        <AIResultCard key={item.metric} metric={item.metric} score={item.score} status={item.status} insight={item.insight} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['Skin Score', 'Awaiting scan'],
                        ['Hydration', 'Pending analysis'],
                        ['Texture', 'Awaiting scan'],
                        ['Match Rate', 'Queued'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[1.5rem] border border-dashed border-rose-100/50 bg-[linear-gradient(180deg,rgba(255,250,250,0.92),rgba(255,245,246,0.86))] p-4">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-rose-400">{label}</p>
                          <p className="mt-3 font-display text-2xl font-semibold text-pearl/70">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {phase !== 'complete' ? (
                    <div className="rounded-[1.5rem] border border-rose-100/40 bg-[linear-gradient(180deg,rgba(255,250,250,0.94),rgba(255,245,246,0.86))] p-4 text-sm text-mist">
                      Result cards will populate here after the scan completes, keeping the interface calm and balanced.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {phase === 'complete' ? (
          <motion.div
            className="mt-20 space-y-4 lg:mt-28"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.12 }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-600">Personalized Routine</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-pearl md:text-3xl">Precision-Matched Skincare</h2>
                <p className="mt-1 max-w-2xl text-xs text-mist">{recommendationSummary}</p>
              </div>
              <Link to="/recommendations" className="shrink-0 block mt-3 sm:mt-0">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all →
                </Button>
              </Link>
            </div>

            <Card className="border border-rose-100/50 bg-white/80 p-5 backdrop-blur-md">
              {loadingProducts ? (
                <div className="flex h-32 items-center justify-center text-sm font-semibold text-mist">
                  Preparing matching products...
                </div>
              ) : rankedProducts.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm font-semibold text-mist">
                  No matching products are available yet. Add products in the admin dashboard.
                </div>
              ) : (
                <ScanProductGrid products={rankedProducts.slice(0, 6)} />
              )}
            </Card>
          </motion.div>
        ) : null}

        <Modal open={showPaywall} title="Cần nâng cấp để quét tiếp" onClose={() => setShowPaywall(false)}>
          <div className="space-y-4 text-sm text-mist">
            <p>Bạn đã dùng hết {maxFreeScans} lượt quét của gói {plan}. Vui lòng nạp tiền để tiếp tục quét.</p>
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-4 text-xs text-rose-950">
              <p className="font-semibold">Gợi ý:</p>
              <p className="mt-1">Nâng cấp gói để mở khóa quét không giới hạn và lưu trữ lịch sử đầy đủ.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowPaywall(false)}>Đóng</Button>
              <Link to="/checkout">
                <Button variant="ghost">Nạp tiền</Button>
              </Link>
            </div>
          </div>
        </Modal>

        <Modal
          open={showOnboarding}
          title="Welcome to AI Scan"
          onClose={() => {
            setShowOnboarding(false)
            markScanOnboardingSeen()
          }}
        >
          <div className="space-y-3 text-sm text-mist">
            <p>1. Upload a selfie or open your webcam.</p>
            <p>2. Run the AI scan to generate skin metrics and score.</p>
            <p>3. Browse the product grid below and click to buy at partner stores.</p>
            <Button
              className="mt-2 w-full"
              onClick={() => {
                setShowOnboarding(false)
                markScanOnboardingSeen()
              }}
            >
              Start Experience
            </Button>
          </div>
        </Modal>
      </div>
    </section>
  )
}