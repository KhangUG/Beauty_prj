import { type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@/shared/components/ui/Loader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserRole } from '@/shared/types/auth'

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: UserRole[]
}>
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, role, initialized, isLoading } = useAuth()

  if (!initialized || isLoading) {
    return <Loader fullScreen label="Checking secure session" />
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
