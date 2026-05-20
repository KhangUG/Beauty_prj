import { type ScanResult } from '@/shared/lib/types'
import { databaseService } from '@/services/supabase/database-service'
import { env } from '@/config/env'

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function buildReason(metric: string, value: number) {
  return `Aligned with ${metric} score ${value}/100 and your current skin profile.`
}

export async function persistScan(userId: string, result: ScanResult) {
  // Dev-only fallback: allow saving scans locally when no authenticated user
  if ((!userId || userId === '') && env.allowGuestScans) {
    const products = await databaseService.getProducts().catch(() => [])
    const topProducts = (products || []).slice(0, 3)
    const id = makeId()
    const now = new Date().toISOString()

    const recommendations = topProducts.map((product, index) => ({
      id: makeId(),
      productId: product.id,
      reason:
        index === 0
          ? buildReason('hydration', result.hydration.value)
          : index === 1
          ? buildReason('acne', result.acne.value)
          : buildReason('dark circles', result.darkCircles.value),
    }))

    const scan = { id, userId: null, result, created_at: now, recommendations }
    const existing = JSON.parse(localStorage.getItem('guest_scans') || '[]')
    existing.unshift(scan)
    localStorage.setItem('guest_scans', JSON.stringify(existing))
    return id
  }

  const products = await databaseService.getProducts()
  const topProducts = products.slice(0, 3)
  const scanId = await databaseService.saveScan(userId, result)

  await databaseService.saveRecommendations(
    scanId,
    topProducts.map((product, index) => ({
      productId: product.id,
      reason:
        index === 0
          ? buildReason('hydration', result.hydration.value)
          : index === 1
          ? buildReason('acne', result.acne.value)
          : buildReason('dark circles', result.darkCircles.value),
    })),
  )

  return scanId
}
