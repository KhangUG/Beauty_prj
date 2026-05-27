import type { Plan } from "@/services/supabase/database-service"

export type UserRole = 'guest' | 'user' | 'admin'
export type SubscriptionTier = 'guest' | 'free' | 'pro' | 'premium'

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  plan_id: string | null
  plan: Plan | null          // joined từ Supabase
  avatar_url: string | null
  updated_at: string
  stripe_customer_id: string | null
}
