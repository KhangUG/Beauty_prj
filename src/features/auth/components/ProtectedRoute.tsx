import { type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@/shared/components/ui/Loader'
import { useAuth } from '@/features/auth/hooks/useAuth'

type ProtectedRouteProps = PropsWithChildren & {
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, initialized, isLoading, isAdmin } = useAuth()

  if (!initialized || isLoading) {
    return <Loader fullScreen label="Checking secure session" />
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
