import { supabase } from '@/services/supabase/client'
import { type ScanResult } from '@/shared/lib/types'

type SaveRecommendationInput = {
  productId: string
  reason: string
}

export type AdminProductRecord = {
  id: string
  name: string
  description: string
  image_url: string
  external_url: string
  tags: string[]
  created_at: string
}

export type AdminScanRecord = {
  id: string
  created_at: string
  user_id: string
  metrics: ScanResult
  score: number
}

export type AdminRecommendationRecord = {
  id: string
  scan_id: string
  product_id: string
  reason: string
  created_at: string
}

type CreateProductInput = Omit<AdminProductRecord, 'id' | 'created_at'>

type UpdateProductInput = Partial<CreateProductInput>

type CreateRecommendationInput = {
  scanId: string
  productId: string
  reason: string
}

type UpdateRecommendationInput = Partial<CreateRecommendationInput>

type UpdateScanInput = Partial<Pick<AdminScanRecord, 'score' | 'metrics'>>

export const databaseService = {
  async getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminProductRecord[]
  },

  async getAdminProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminProductRecord[]
  },

  async createProduct(input: CreateProductInput) {
    const { data, error } = await supabase.from('products').insert(input).select('*').single()
    if (error) throw error
    return data as AdminProductRecord
  },

  async updateProduct(id: string, input: UpdateProductInput) {
    const { data, error } = await supabase.from('products').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminProductRecord
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
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

  async getAdminScans() {
    const { data, error } = await supabase.from('scans').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminScanRecord[]
  },

  async updateScan(id: string, input: UpdateScanInput) {
    const { data, error } = await supabase.from('scans').update(input).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminScanRecord
  },

  async deleteScan(id: string) {
    const { error } = await supabase.from('scans').delete().eq('id', id)
    if (error) throw error
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

  async getAdminRecommendations() {
    const { data, error } = await supabase.from('recommendations').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminRecommendationRecord[]
  },

  async createRecommendation(input: CreateRecommendationInput) {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({ scan_id: input.scanId, product_id: input.productId, reason: input.reason })
      .select('*')
      .single()
    if (error) throw error
    return data as AdminRecommendationRecord
  },

  async updateRecommendation(id: string, input: UpdateRecommendationInput) {
    const payload: Record<string, string> = {}

    if (input.scanId) payload.scan_id = input.scanId
    if (input.productId) payload.product_id = input.productId
    if (input.reason) payload.reason = input.reason

    const { data, error } = await supabase.from('recommendations').update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return data as AdminRecommendationRecord
  },

  async deleteRecommendation(id: string) {
    const { error } = await supabase.from('recommendations').delete().eq('id', id)
    if (error) throw error
  },
}
