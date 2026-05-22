import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
import { MakeupInputPanel } from '@/features/ai-scan/components/MakeupInputPanel'
import { MakeupResultPanel } from '@/features/ai-scan/components/MakeupResultPanel'
import { MakeupRelatedProducts } from '@/features/ai-scan/components/MakeupRelatedProducts'
import { DEFAULT_MAKEUP_EFFECTS, SAMPLE_SELFIE_URLS } from '@/features/ai-scan/lib/makeup-defaults'
import { matchProductsToEffects } from '@/features/ai-scan/lib/makeup-product-matcher'
import { useMakeupCatalog } from '@/features/ai-scan/hooks/useMakeupCatalog'
import { isMakeupApiConfigured, runMakeupVirtualTryOn } from '@/features/ai-scan/services/makeup-vto-service'
import type { MakeupEffect, MakeupVtoTaskStatus } from '@/features/ai-scan/types/makeup-vto'

function cloneDefaultEffects(): MakeupEffect[] {
  return DEFAULT_MAKEUP_EFFECTS.map((effect) => ({
    ...effect,
    palettes: effect.palettes?.map((palette) => ({ ...palette })),
    pattern: effect.pattern ? { ...effect.pattern } : undefined,
    shape: effect.shape ? { ...effect.shape } : undefined,
    style: effect.style ? { ...effect.style } : undefined,
    morphology: effect.morphology ? { ...effect.morphology } : undefined,
  }))
}

export default function AIScanPage() {
  const { user } = useAuth()
  const toast = useToast()
  const apiConfigured = isMakeupApiConfigured()

  const [imageSource, setImageSource] = useState(SAMPLE_SELFIE_URLS[0])
  const [effects, setEffects] = useState<MakeupEffect[]>(cloneDefaultEffects)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<MakeupVtoTaskStatus>('idle')
  const [isDemo, setIsDemo] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const catalogQuery = useMakeupCatalog()

  const activeCategories = useMemo(
    () => effects.filter((effect) => effect.enabled !== false).map((effect) => effect.category),
    [effects],
  )

  const matchedProducts = useMemo(() => {
    if (!catalogQuery.data?.length) return []
    return matchProductsToEffects(effects, catalogQuery.data, 12)
  }, [effects, catalogQuery.data])

  const processMutation = useMutation({
    mutationFn: async () => {
      setTaskStatus('running')
      setErrorMessage(null)
      return runMakeupVirtualTryOn({
        imageSource,
        effects,
        userId: user?.id,
      })
    },
    onSuccess: (result) => {
      setResultUrl(result.resultUrl)
      setDownloadUrl(result.downloadUrl)
      setIsDemo(result.mode === 'demo')
      setTaskStatus('success')
      toast.success(result.mode === 'demo' ? 'Demo preview ready' : 'Makeup applied successfully')
    },
    onError: (error: Error) => {
      setTaskStatus('error')
      setErrorMessage(error.message)
      toast.error(error.message)
    },
  })

  return (
    <section className="section-shell pb-16 pt-4">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <motion.div
          className="rounded-[2rem] border border-rose-100/50 bg-white/90 p-6 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-rose-600">AI Makeup Virtual Try-On</p>
          <h1 className="mt-2 font-display text-3xl font-black text-pearl md:text-4xl">Makeup Studio</h1>
          <p className="mt-2 max-w-3xl text-sm text-mist">
            Configure makeup on the left, preview results in the center, and browse catalog products matched to your
            selected colors and categories on the right.
          </p>
        </motion.div>

        <div className="grid min-h-[720px] grid-cols-1 gap-4 lg:h-[calc(100dvh-17rem)] lg:grid-cols-3">
          <div className="h-[min(720px,70vh)] min-h-[480px] min-w-0 lg:h-full lg:min-h-0">
          <MakeupInputPanel
            imageSource={imageSource}
            effects={effects}
            isProcessing={processMutation.isPending}
            apiConfigured={apiConfigured}
            onImageChange={setImageSource}
            onEffectsChange={setEffects}
            onProcess={() => processMutation.mutate()}
          />
          </div>

          <div className="h-[min(720px,70vh)] min-h-[480px] min-w-0 lg:h-full lg:min-h-0">
          <MakeupResultPanel
            imageSource={imageSource}
            resultUrl={resultUrl}
            downloadUrl={downloadUrl}
            status={taskStatus}
            isDemo={isDemo}
            errorMessage={errorMessage}
          />
          </div>

          <div className="h-[min(720px,70vh)] min-h-[480px] min-w-0 lg:h-full lg:min-h-0">
          <MakeupRelatedProducts
            products={matchedProducts}
            isLoading={catalogQuery.isLoading}
            activeCategories={activeCategories}
          />
          </div>
        </div>
      </div>
    </section>
  )
}
