// features/plans/hooks/useActiveSubscription.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/client'
import { useAuth } from '@/features/auth/hooks/useAuth'

export interface ActiveSubscription {
  plan_id: string
  expires_at: string | null
  current_period_end: string | null
  status: string
}

export function useActiveSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('subscriptions')
      .select('plan_id, expires_at, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setSubscription(data ?? null)
        setLoading(false)
      })
  }, [user?.id])

  return { subscription, loading }
}