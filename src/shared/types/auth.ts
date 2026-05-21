export type UserRole = 'guest' | 'free' | 'premium' | 'admin'

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  subscription_tier: string
  try_on_credits: number
  avatar_url: string | null
  updated_at: string
}
