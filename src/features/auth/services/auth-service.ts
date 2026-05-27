import { supabase } from '@/services/supabase/client'
import type { UserProfile } from '@/shared/types/auth'

export const authService = {
  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async updateProfile(
    userId: string,
    input: Partial<Pick<UserProfile, 'first_name' | 'last_name' | 'avatar_url'>>,
  ): Promise<UserProfile> {
    const payload = { ...input, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*, plan:plans(*)')   // join để trả về plan luôn
      .single()

    if (error) throw error
    return data as UserProfile
  },

    async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, plan:plans(*)')   // 👈 join sang bảng plans
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data as UserProfile
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, firstName?: string, lastName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    })
    if (error) throw error
    return data
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    })
    if (error) throw error
    return data
  },
  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
    return data
  },
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
