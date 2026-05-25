import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
import { MakeupInputPanel } from '@/features/ai-scan/components/MakeupInputPanel'
import { MakeupResultPanel } from '@/features/ai-scan/components/MakeupResultPanel'
import { MakeupRelatedProducts } from '@/features/ai-scan/components/MakeupRelatedProducts'
import { DEFAULT_MAKEUP_EFFECTS } from '@/features/ai-scan/lib/makeup-defaults'
import { matchProductsToEffects } from '@/features/ai-scan/lib/makeup-product-matcher'
import { useMakeupCatalog } from '@/features/ai-scan/hooks/useMakeupCatalog'
import { useCategories } from '@/features/ai-scan/hooks/useCategories'
import { runMakeupVirtualTryOn } from '@/features/ai-scan/services/makeup-vto-service'
import { persistScan } from '@/features/ai-scan/services/scan-persistence-service'
import { mockScanResult } from '@/shared/data/mock-scan'
import {
  getScanQuotaForRole,
  getScanUsesThisMonth,
  registerScanUsage,
} from '@/features/ai-scan/services/scan-usage-service'
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
  const { user, subscriptionTier, adminRole } = useAuth()
  const toast = useToast()

  const [scanCount, setScanCount] = useState(0)
  const [imageSource, setImageSource] = useState('')
  const [effects, setEffects] = useState<MakeupEffect[]>(cloneDefaultEffects)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<MakeupVtoTaskStatus>('idle')
  const [isDemo, setIsDemo] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const catalogQuery = useMakeupCatalog()
  const categoriesQuery = useCategories()

  const activeCategories = useMemo(
    () => effects.filter((effect) => effect.enabled === true).map((effect) => effect.category),
    [effects],
  )

  const matchedProducts = useMemo(() => {
    if (!catalogQuery.data?.length) return []
    return matchProductsToEffects(effects, catalogQuery.data, 12)
  }, [effects, catalogQuery.data])

  const planId = user ? subscriptionTier : 'guest'
  const isAdminUser = adminRole !== null
  const scanQuota = isAdminUser ? null : getScanQuotaForRole(planId)
  const isQuotaExceeded = !user || (scanQuota !== null && scanCount >= scanQuota)

  useEffect(() => {
    let active = true

    const refreshScanCount = async () => {
      const count = await getScanUsesThisMonth(user?.id)
      if (active) {
        setScanCount(count)
      }
    }

    void refreshScanCount()
    return () => {
      active = false
    }
  }, [user?.id])

  const handleProcessClick = () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để bắt đầu scan. Vui lòng đăng nhập và thử lại.')
      return
    }

    if (isQuotaExceeded) {
      toast.error('Bạn đã dùng hết lượt scan trong tháng này. Vui lòng nâng cấp hoặc thử lại tháng sau.')
      return
    }

    processMutation.mutate()
  }

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
    onSuccess: async (result) => {
      setResultUrl(result.resultUrl)
      setDownloadUrl(result.downloadUrl)
      setIsDemo(result.mode === 'demo')
      setTaskStatus('success')
      if (user?.id) {
        try {
          await persistScan(user.id, mockScanResult)
        } catch (error) {
          console.error('Failed to persist scan history:', error)
          toast.error('Không lưu được lịch sử scan. Vui lòng thử lại sau.')
        }
      }
      registerScanUsage(user?.id)
      setScanCount((prev) => prev + 1)
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
          <p className="mt-4 text-sm text-mist">
            Plan: <span className="font-semibold capitalize">{planId}</span> · {scanQuota === null ? 'Unlimited scans' : user ? `${scanCount}/${scanQuota} scans used this month` : 'Sign in to start scanning'}
          </p>
        </motion.div>

        <div className="grid min-h-[720px] grid-cols-1 gap-4 lg:h-[calc(100dvh-17rem)] lg:grid-cols-3">
          <div className="h-[min(720px,70vh)] min-h-[480px] min-w-0 lg:h-full lg:min-h-0">
          <MakeupInputPanel
            imageSource={imageSource}
            effects={effects}
            categories={categoriesQuery.data ?? []}
            isProcessing={processMutation.isPending}
            processDisabled={isQuotaExceeded}
            processDisabledReason={
              !user
                ? 'Đăng nhập để sử dụng tính năng scan.'
                : isQuotaExceeded
                ? `Bạn đã dùng hết ${scanQuota} lượt scan trong tháng này.`
                : undefined
            }
            onImageChange={setImageSource}
            onEffectsChange={setEffects}
            onProcess={handleProcessClick}
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
