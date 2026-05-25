import { useQuery } from '@tanstack/react-query'
import { databaseService } from '@/services/supabase/database-service'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => databaseService.getCategories(),
    staleTime: 1000 * 60 * 5,
  })
}
