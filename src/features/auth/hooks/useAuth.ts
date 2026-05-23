import { useAuthStore } from '@/features/auth/store/auth-store'
import { type AdminRole } from '@/shared/lib/admin'
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

  const adminRole: AdminRole | null = profile?.role === 'admin' || role === 'admin' ? 'admin' : null
  const isAdmin = profile?.role === 'admin' || role === 'admin'

  const displayName = getDisplayName(profile, user, user?.id)
  const avatarUrl = getAvatarUrl(profile, user, user?.id)
  const subscriptionTier = profile?.role === 'admin'
    ? 'admin'
    : profile?.subscription_tier ?? 'free'

  return {
    user,
    session,
    role,
    profile,
    displayName,
    avatarUrl,
    subscriptionTier,
    adminRole,
    isAdmin,
    isLoading,
    initialized,
    signOut,
    refreshProfile,
  }
}
