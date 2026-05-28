import type { MakeupEffect, MakeupVtoPayload } from '@/features/ai-scan/types/makeup-vto'
import { buildApiEffects } from '@/features/ai-scan/lib/makeup-defaults'
import { storageService } from '@/services/supabase/storage-service'
import { supabase } from '@/services/supabase/client'

// ✅ Không còn API_KEY ở client nữa
const API_BASE = import.meta.env.VITE_MAKEUP_API_BASE_URL ?? 'https://yce-api-01.makeupar.com'

type TaskResponse = {
  status?: number
  data?: {
    task_id?: string
    task_status?: string
    results?: { url?: string; download_url?: string } | Array<{ download_url?: string }>
    failure_reason?: string
    error?: string
    error_message?: string
  }
  error?: string
  error_code?: string
}

async function ensurePublicImageUrl(imageSource: string, userId: string) {
  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    return imageSource
  }
  if (!imageSource.startsWith('data:') && !imageSource.startsWith('blob:')) {
    throw new Error('Unsupported image source. Upload a file or use a public URL.')
  }
  const response = await fetch(imageSource)
  const blob = await response.blob()
  const extension = blob.type.includes('png') ? 'png' : 'jpg'
  const file = new File([blob], `makeup-selfie.${extension}`, { type: blob.type || 'image/jpeg' })
  const fileName = `${userId || 'guest'}/makeup-${Date.now()}.${extension}`
  await storageService.uploadScanImage(file, fileName)
  return storageService.getPublicImageUrl(fileName)
}

function extractResultUrl(data: TaskResponse['data']) {
  if (!data?.results) return null
  if (Array.isArray(data.results)) return data.results[0]?.download_url ?? null
  return data.results.url ?? data.results.download_url ?? null
}

// Gọi qua Edge Function thay vì trực tiếp
async function callProxy(body: object) {
  const { data, error } = await supabase.functions.invoke('makeup-proxy', { body })
  if (error) throw new Error(error.message)
  return data as TaskResponse
}

export function isMakeupApiConfigured() {
  // Không thể check key ở client nữa — luôn trả true, Edge Function sẽ báo lỗi nếu chưa config
  return true
}

export async function runMakeupVirtualTryOn(input: {
  imageSource: string
  effects: MakeupEffect[]
  userId?: string
}) {
  const originalPublicUrl = await ensurePublicImageUrl(
    input.imageSource,
    input.userId ?? 'guest',
  )

  const payload: MakeupVtoPayload = {
    src_file_url: originalPublicUrl,
    effects: buildApiEffects(input.effects),
    version: '1.0',
  }

  // Start task qua proxy
  let startResponse: TaskResponse
  try {
    startResponse = await callProxy({ action: 'start', payload })
  } catch {
    // Nếu Edge Function lỗi → fallback demo
    await new Promise((resolve) => setTimeout(resolve, 1800))
    return {
      mode: 'demo' as const,
      resultUrl: originalPublicUrl,
      downloadUrl: originalPublicUrl,
      originalPublicUrl,
      payload,
    }
  }

  const taskId = startResponse.data?.task_id
  if (!taskId) throw new Error('Makeup API did not return a task id.')

  // Poll status qua proxy
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const statusResponse = await callProxy({ action: 'status', taskId })
    const status = statusResponse.data?.task_status

    if (status === 'success') {
      const resultUrl = extractResultUrl(statusResponse.data)
      if (!resultUrl) throw new Error('Task succeeded but no result image URL was returned.')
      return {
        mode: 'api' as const,
        taskId,
        resultUrl,
        downloadUrl: resultUrl,
        originalPublicUrl,
        payload,
      }
    }

    if (status === 'error') {
      throw new Error(
        statusResponse.data?.failure_reason ??
        statusResponse.data?.error_message ??
        statusResponse.data?.error ??
        'Makeup processing failed.',
      )
    }
  }

  throw new Error('Makeup task timed out. Please try again.')
}