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
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

let unsubscribeAuth: (() => void) | null = null
let initPromise: Promise<void> | null = null

async function resolveProfile(userId: string) {
  const profile = await authService.getProfile(userId)
  const role: UserRole = profile?.role ?? 'guest'
  return { profile, role }
}

/** Load profile outside onAuthStateChange to avoid Supabase auth deadlocks. */
function scheduleProfileLoad(userId: string) {
  setTimeout(() => {
    void resolveProfile(userId)
      .then(({ profile, role }) => {
        useAuthStore.setState({ profile, role })
      })
      .catch((error) => {
        console.error('Error loading profile after auth change:', error)
        useAuthStore.setState({ profile: null, role: 'guest' })
      })
  }, 0)
}

function applySessionFromAuthEvent(session: Session | null) {
  if (!session?.user) {
    useAuthStore.setState({ session, user: null, profile: null, role: 'guest' })
    return
  }

  useAuthStore.setState({ session, user: session.user })
  scheduleProfileLoad(session.user.id)
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  profile: null,
  role: 'guest',
  isLoading: false,
  initialized: false,
  setSession: async (session) => {
    if (!session?.user) {
      set({ session: null, user: null, profile: null, role: 'guest' })
      return
    }

    const { profile, role } = await resolveProfile(session.user.id)
    set({ session, user: session.user, profile, role })
  },
  initialize: async () => {
    if (unsubscribeAuth) {
      try {
        const session = await authService.getSession()
        if (session?.user) {
          const { profile, role } = await resolveProfile(session.user.id)
          set({ session, user: session.user, profile, role })
        } else {
          set({ session: null, user: null, profile: null, role: 'guest' })
        }
      } catch (error) {
        console.error('Auth refresh failed:', error)
      } finally {
        set({ initialized: true, isLoading: false })
      }
      return
    }

    if (initPromise) {
      return initPromise
    }

    initPromise = (async () => {
      set({ isLoading: true })
      try {
        const session = await authService.getSession()
        let role: UserRole = 'guest'
        let profile: UserProfile | null = null

        if (session?.user) {
          const resolved = await resolveProfile(session.user.id)
          profile = resolved.profile
          role = resolved.role
        }

        set({
          session,
          user: session?.user ?? null,
          role,
          profile,
          initialized: true,
        })

        const subscription = authService.onAuthStateChange(async (_event, nextSession) => {
          applySessionFromAuthEvent(nextSession)
        })

        unsubscribeAuth = () => subscription.data.subscription.unsubscribe()
      } catch (error) {
        console.error('Auth initialization failed:', error)
        set({
          session: null,
          user: null,
          profile: null,
          role: 'guest',
          initialized: true,
        })
      } finally {
        set({ isLoading: false })
        initPromise = null
      }
    })()

    return initPromise
  },
  refreshProfile: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return

    const { profile, role } = await resolveProfile(userId)
    set({ profile, role })
  },
  signOut: async () => {
    await authService.signOut()
    set({ session: null, user: null, role: 'guest', profile: null })
  },
}))
