import { useQuery } from '@tanstack/react-query'
import {
  CATALOG_CACHE_VERSION,
  fetchPatternCatalog,
  hasPatternCatalog,
} from '@/features/ai-scan/lib/makeup-patterns'

export function usePatternCatalog(category: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['makeup', 'patterns', category, CATALOG_CACHE_VERSION],
    queryFn: () => fetchPatternCatalog(category!),
    enabled: Boolean(enabled && category && hasPatternCatalog(category)),
    staleTime: 0,
    gcTime: 1000 * 60 * 30,
  })
}
