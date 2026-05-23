import { getLocalStorageItem, setLocalStorageItem } from '@/shared/lib/storage'
import type { UserRole } from '@/shared/types/auth'
import { databaseService } from '@/services/supabase/database-service'

const SCAN_USAGE_STORAGE_KEY = 'ai_scan_usage_history'
const GUEST_SCAN_KEY = 'guest'

function getMonthPrefix(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function getUserKey(userId?: string) {
  return userId?.trim() ? userId : GUEST_SCAN_KEY
}

export function getScanQuotaForRole(role: UserRole | string) {
  switch (role) {
    case 'admin':
      return null
    case 'premium':
      return 500
    case 'pro':
      return 25
    case 'free':
      return 2
    case 'guest':
    default:
      return 0
  }
}

export function getScanUsageHistory() {
  return getLocalStorageItem<Record<string, string[]>>(SCAN_USAGE_STORAGE_KEY, {})
}

export function getScanUsageForUser(userId?: string) {
  const records = getScanUsageHistory()
  return records[getUserKey(userId)] ?? []
}

export async function getScanUsesThisMonth(userId?: string) {
  if (userId) {
    return databaseService.getScanCountThisMonth(userId)
  }

  const prefix = getMonthPrefix()
  return getScanUsageForUser(userId).filter((timestamp) => timestamp.startsWith(prefix)).length
}

export function registerScanUsage(userId?: string) {
  if (userId) {
    return
  }

  const key = getUserKey(userId)
  const history = getScanUsageHistory()
  const entry = new Date().toISOString()
  history[key] = [entry, ...(history[key] ?? [])].slice(0, 500)
  setLocalStorageItem(SCAN_USAGE_STORAGE_KEY, history)
}
