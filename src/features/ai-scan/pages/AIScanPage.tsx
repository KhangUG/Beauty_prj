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
    <section className="section-shell pb-10">
      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card className="space-y-5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">AI Scan Studio</p>
          <h1 className="font-display text-4xl text-pearl">Skin Intelligence Capture</h1>
          <p className="text-sm text-mist">{statusText}</p>

          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-mist transition hover:border-cyan/60">
            Upload Selfie
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => setWebcamOpen(true)}>
              Open Webcam
            </Button>
            {webcamOpen ? <Button variant="ghost" onClick={captureFromWebcam}>Capture Frame</Button> : null}
            <Button onClick={() => void runFakeScan()} disabled={!imagePreview || phase === 'scanning'}>
              Run AI Scan
            </Button>
            <Button variant="accent" onClick={reset}>
              Reset
            </Button>
          </div>

          {cameraError ? <p className="text-sm text-rose-300">{cameraError}</p> : null}

          {phase === 'scanning' ? (
            <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {scanMessages.map((message, index) => (
                <motion.p
                  key={message}
                  className="text-sm text-mist"
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
            <div className="space-y-3">
              <Link to="/recommendations">
                <Button className="w-full" size="lg">
                  Continue to Recommendations
                </Button>
              </Link>
              <p className="text-xs text-mist">
                {persistMutation.isPending
                  ? 'Saving scan history...'
                  : persistMutation.error
                    ? 'Could not save to Supabase. Please check your env and database policies.'
                    : 'Scan saved to your history.'}
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <div className="mb-4 h-80 overflow-hidden rounded-3xl border border-white/15 bg-velvet">
            {webcamOpen ? (
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            ) : imagePreview ? (
              <img src={imagePreview} alt="Scan preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-mist">No image selected yet.</div>
            )}
          </div>

          {scanResult ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <AIResultCard metric="Skin Score" score={scanResult.skinScore} status="great" insight="Overall facial skin quality index" />
              <AIResultCard metric={scanResult.acne.label} score={scanResult.acne.value} status={scanResult.acne.status} insight="Moderate inflammation detected" />
              <AIResultCard metric={scanResult.hydration.label} score={scanResult.hydration.value} status={scanResult.hydration.status} insight="Healthy moisture retention" />
              <AIResultCard metric={scanResult.darkCircles.label} score={scanResult.darkCircles.value} status={scanResult.darkCircles.status} insight="Mild under-eye fatigue signs" />
            </div>
          ) : null}
        </Card>
      </div>

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
          <p>3. Move to recommendations and open product links.</p>
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
