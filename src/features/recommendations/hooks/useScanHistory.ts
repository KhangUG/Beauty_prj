import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'

export function useScanHistory(userId?: string) {
  return useQuery({
    queryKey: ['scan-history', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return []
      return databaseService.getScanHistory(userId)
    },
  })
}
