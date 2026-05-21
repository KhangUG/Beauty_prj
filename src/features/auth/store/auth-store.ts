import { create } from 'zustand'
import { type Session, type User } from '@supabase/supabase-js'
import { authService } from '@/features/auth/services/auth-service'
import type { UserProfile, UserRole } from '@/shared/types/auth'
type AuthStore = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  role: UserRole
  isLoading: boolean
  initialized: boolean
  setSession: (session: Session | null) => Promise<void>
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

let unsubscribeAuth: (() => void) | null = null

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  profile: null,
  role: 'guest',
  isLoading: false,
  initialized: false,
  setSession: async (session) => {
    let role: UserRole = 'guest'
    let profile: UserProfile | null = null
    if (session?.user) {
      profile = await authService.getProfile(session.user.id)
      if (profile) role = profile.role
    }
    set({ session, user: session?.user ?? null, role, profile })
  },
  initialize: async () => {
    if (unsubscribeAuth) {
      set({ initialized: true })
      return
    }

    set({ isLoading: true })
    const session = await authService.getSession()
    let role: UserRole = 'guest'
    let profile: UserProfile | null = null
    if (session?.user) {
      profile = await authService.getProfile(session.user.id)
      if (profile) role = profile.role
    }

    set({ session, user: session?.user ?? null, role, profile, isLoading: false, initialized: true })

    const subscription = authService.onAuthStateChange(async (_event, nextSession) => {
      let nextRole: UserRole = 'guest'
      let nextProfile: UserProfile | null = null
      if (nextSession?.user) {
        nextProfile = await authService.getProfile(nextSession.user.id)
        if (nextProfile) nextRole = nextProfile.role
      }
      set({ session: nextSession, user: nextSession?.user ?? null, role: nextRole, profile: nextProfile })
    })

    unsubscribeAuth = () => subscription.data.subscription.unsubscribe()
  },
  signOut: async () => {
    await authService.signOut()
    set({ session: null, user: null, role: 'guest', profile: null })
  },
}))
