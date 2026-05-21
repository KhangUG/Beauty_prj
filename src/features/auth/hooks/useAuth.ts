import { useAuthStore } from '@/features/auth/store/auth-store'
import { getSubscriptionTier } from '@/shared/lib/subscription'
import { getAdminRole, type AdminRole } from '@/shared/lib/admin'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const role = useAuthStore((state) => state.role)
  const profile = useAuthStore((state) => state.profile)
  const isLoading = useAuthStore((state) => state.isLoading)
  const initialized = useAuthStore((state) => state.initialized)
  const signOut = useAuthStore((state) => state.signOut)

  const overrideTier = getSubscriptionTier(user?.id ?? 'guest')

  // Compute admin role from session user
  const adminRole: AdminRole | null = role === 'admin' ? 'superadmin' : getAdminRole(session?.user ?? null)
  const isAdmin = role === 'admin' || !!adminRole

  return {
    user,
    session,
    role,
    profile,
    subscriptionTier: overrideTier ?? profile?.subscription_tier ?? 'free',
    adminRole,
    isAdmin,
    isLoading,
    initialized,
    signOut,
  }
}
