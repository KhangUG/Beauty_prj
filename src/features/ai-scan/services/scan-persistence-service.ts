import { type ScanResult } from '@/shared/lib/types'
import { databaseService } from '@/services/supabase/database-service'

function buildReason(metric: string, value: number) {
  return `Aligned with ${metric} score ${value}/100 and your current skin profile.`
}

export async function persistScan(userId: string, result: ScanResult) {
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
