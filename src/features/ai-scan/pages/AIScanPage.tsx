import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AIResultCard } from '@/shared/components/ui/AIResultCard'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Modal } from '@/shared/components/ui/Modal'
import { useScanStore } from '@/features/ai-scan/store/scan-store'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { persistScan } from '@/features/ai-scan/services/scan-persistence-service'
import { useUIStore } from '@/store/ui-store'
import { useRecommendations } from '@/features/recommendations/hooks/useRecommendations'
import { ScanProductGrid } from '@/shared/components/ui/ScanProductGrid'
import { mockProducts } from '@/shared/data/mock-products'

const scanMessages = [
  'Calibrating light map...',
  'Detecting texture signatures...',
  'Estimating hydration and sebum trends...',
  'Matching ingredients to skin profile...',
]

export default function AIScanPage() {
  const { phase, imagePreview, scanResult, setImagePreview, runFakeScan, reset } = useScanStore()
  const { user } = useAuth()
  const hasSeenScanOnboarding = useUIStore((state) => state.hasSeenScanOnboarding)
  const markScanOnboardingSeen = useUIStore((state) => state.markScanOnboardingSeen)
  const [webcamOpen, setWebcamOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenScanOnboarding)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const { data: recommendedProducts, isLoading: loadingProducts } = useRecommendations()
  const displayProducts = recommendedProducts && recommendedProducts.length > 0 ? recommendedProducts : mockProducts

  const persistMutation = useMutation({
    mutationFn: async () => {
      if (!scanResult) return null
      const userId = user?.id ?? 'guest-user'
      return persistScan(userId, scanResult)
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [
    phase,
    scanResult,
    persistMutation,
    persistMutation.isError,
    persistMutation.isPending,
    persistMutation.isSuccess,
  ])

  return (
    <section className="section-shell pb-10 space-y-6">

      {/* ── Compact Scan Bar ── */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">

          {/* Left: controls */}
          <div className="flex flex-col gap-3 lg:w-72 shrink-0">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan font-bold">AI Scan Studio</p>
              <h1 className="font-display text-xl font-extrabold text-pearl leading-tight">Skin Intelligence Capture</h1>
              <p className="mt-0.5 text-xs text-mist">{statusText}</p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-rose-200/80 bg-white/80 px-4 py-2.5 text-xs text-mist transition hover:border-cyan/60">
              <span>📷 Upload Selfie</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setWebcamOpen(true)}>Webcam</Button>
              {webcamOpen ? <Button variant="ghost" size="sm" onClick={captureFromWebcam}>Capture</Button> : null}
              <Button size="sm" onClick={() => void runFakeScan()} disabled={!imagePreview || phase === 'scanning'}>
                Run Scan
              </Button>
              <Button variant="accent" size="sm" onClick={reset}>Reset</Button>
            </div>

            {cameraError ? <p className="text-xs text-rose-300">{cameraError}</p> : null}

            {phase === 'scanning' ? (
              <motion.div className="space-y-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {scanMessages.map((message, index) => (
                  <motion.p
                    key={message}
                    className="text-[11px] text-mist"
                    initial={{ opacity: 0.2 }}
                    animate={{ opacity: [0.2, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.35 }}
                  >
                    {message}
                  </motion.p>
                ))}
              </motion.div>
            ) : null}

            {phase === 'complete' ? (
              <div className="space-y-1.5">
                <Link to="/recommendations">
                  <Button className="w-full" size="sm">View Full Recommendations →</Button>
                </Link>
                <p className="text-[10px] text-mist">
                  {persistMutation.isPending ? 'Saving...' : persistMutation.error ? 'Save failed.' : 'Scan saved ✓'}
                </p>
              </div>
            ) : null}
          </div>

          {/* Right: image preview + result metrics side by side */}
          <div className="flex flex-1 gap-4 items-start">
            {/* Thumbnail preview (increased size) */}
            <div className="h-52 w-44 shrink-0 overflow-hidden rounded-2xl border border-rose-200/70 bg-velvet">
              {webcamOpen ? (
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              ) : imagePreview ? (
                <img src={imagePreview} alt="Scan preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-mist text-center px-2">No image yet</div>
              )}
            </div>

            {/* Metric cards in a 2×2 compact grid */}
            {scanResult ? (
              <div className="grid flex-1 grid-cols-2 gap-2">
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
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-rose-100 text-xs text-mist/50 h-52">
                Scan results will appear here
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Product Recommendations (always visible, prominent) ── */}
      {phase === 'complete' ? (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-cyan font-bold">Personalized Routine</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-pearl md:text-3xl">
                Precision-Matched Skincare
              </h2>
              <p className="mt-1 text-xs text-mist max-w-2xl">
                Product suggestions tailored to your skin scan. Click a product to buy from our partners.
              </p>
            </div>
            <Link to="/recommendations" className="hidden md:block shrink-0">
              <Button variant="ghost" size="sm" className="text-xs">View all →</Button>
            </Link>
          </div>

          <Card className="p-5 bg-white/30 backdrop-blur-md border border-rose-200/45">
            {loadingProducts ? (
              <div className="flex h-32 items-center justify-center text-sm text-mist font-semibold">
                Preparing matching products...
              </div>
            ) : (
              <ScanProductGrid products={displayProducts} />
            )}
          </Card>
        </motion.div>
      ) : null}

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
    </section>
  )
}

