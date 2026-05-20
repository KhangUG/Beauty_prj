import { supabase } from '@/services/supabase/client'
import { type ScanResult } from '@/shared/lib/types'

type SaveRecommendationInput = {
  productId: string
  reason: string
}

export const databaseService = {
  async getProducts() {
    const { data, error } = await supabase.from('products').select('*').limit(30)
    if (error) throw error
    return data ?? []
  },

  async getScanHistory(userId: string) {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async saveScan(userId: string, scanResult: ScanResult) {
    const { data, error } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        score: scanResult.skinScore,
        metrics: scanResult,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  },

  async saveRecommendations(scanId: string, items: SaveRecommendationInput[]) {
    if (items.length === 0) return

    const { error } = await supabase.from('recommendations').insert(
      items.map((item) => ({
        scan_id: scanId,
        product_id: item.productId,
        reason: item.reason,
      })),
    )

    if (error) throw error
  },
}
