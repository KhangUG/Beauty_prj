import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'
import { env } from '@/config/env'

export function useScanHistory(userId?: string) {
  return useQuery({
    queryKey: ['scan-history', userId],
    enabled: true,
    queryFn: async () => {
      // If userId present, prefer server history
      if (userId) return databaseService.getScanHistory(userId)

      // Dev-only: return guest scans from localStorage when allowed
      if (env.allowGuestScans) {
        const raw = localStorage.getItem('guest_scans') || '[]'
        try {
          return JSON.parse(raw)
        } catch {
          return []
        }
      }

      return []
    },
  })
}
