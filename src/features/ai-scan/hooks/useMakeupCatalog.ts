import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'
import type { MakeupCatalogItem } from '@/features/ai-scan/types/makeup-vto'

export function useMakeupCatalog() {
  return useQuery({
    queryKey: ['makeup', 'catalog'],
    queryFn: async (): Promise<MakeupCatalogItem[]> => {
      const rows = await databaseService.getMakeupCatalog()
      return rows.map((row) => ({ ...row }))
    },
    staleTime: 1000 * 60 * 5,
  })
}
