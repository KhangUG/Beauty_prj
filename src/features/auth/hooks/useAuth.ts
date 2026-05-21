import { useAuthStore } from '@/features/auth/store/auth-store'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const adminRole = useAuthStore((state) => state.adminRole)
  const isLoading = useAuthStore((state) => state.isLoading)
  const initialized = useAuthStore((state) => state.initialized)
  const signOut = useAuthStore((state) => state.signOut)

  return {
    user,
    session,
    isAdmin,
    adminRole,
    isLoading,
    initialized,
    signOut,
  }
}
