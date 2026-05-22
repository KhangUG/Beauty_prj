import { useAuthStore } from '@/features/auth/store/auth-store'
import { getSubscriptionTier } from '@/shared/lib/subscription'
import { getAdminRole, type AdminRole } from '@/shared/lib/admin'
import { getAvatarUrl, getDisplayName } from '@/shared/lib/profile'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const role = useAuthStore((state) => state.role)
  const profile = useAuthStore((state) => state.profile)
  const isLoading = useAuthStore((state) => state.isLoading)
  const initialized = useAuthStore((state) => state.initialized)
  const signOut = useAuthStore((state) => state.signOut)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)

  const overrideTier = getSubscriptionTier(user?.id ?? 'guest')

  // Compute admin role from session user
  const adminRole: AdminRole | null = role === 'admin' ? 'superadmin' : getAdminRole(session?.user ?? null)
  const isAdmin = role === 'admin' || !!adminRole

  const displayName = getDisplayName(profile, user, user?.id)
  const avatarUrl = getAvatarUrl(profile, user, user?.id)

  return {
    user,
    session,
    role,
    profile,
    displayName,
    avatarUrl,
    subscriptionTier: overrideTier ?? profile?.subscription_tier ?? 'free',
    adminRole,
    isAdmin,
    isLoading,
    initialized,
    signOut,
    refreshProfile,
  }
}
