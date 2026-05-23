export type UserRole = 'guest' | 'user' | 'admin'
export type SubscriptionTier = 'guest' | 'free' | 'pro' | 'premium'

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  subscription_tier: SubscriptionTier
  try_on_credits: number
  avatar_url: string | null
  updated_at: string
}
