import { create } from 'zustand'
import { type Session, type User } from '@supabase/supabase-js'
import { authService } from '@/features/auth/services/auth-service'

type AuthStore = {
  session: Session | null
  user: User | null
  isLoading: boolean
  initialized: boolean
  setSession: (session: Session | null) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

let unsubscribeAuth: (() => void) | null = null

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  initialized: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  initialize: async () => {
    if (unsubscribeAuth) {
      set({ initialized: true })
      return
    }

    set({ isLoading: true })
    const session = await authService.getSession()
    set({ session, user: session?.user ?? null, isLoading: false, initialized: true })

    const subscription = authService.onAuthStateChange(async (_event, nextSession) => {
      set({ session: nextSession, user: nextSession?.user ?? null })
    })

    unsubscribeAuth = () => subscription.data.subscription.unsubscribe()
  },
  signOut: async () => {
    await authService.signOut()
    set({ session: null, user: null })
  },
}))
