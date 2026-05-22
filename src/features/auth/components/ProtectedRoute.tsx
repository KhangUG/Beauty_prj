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
  const { user, role, isAdmin, initialized } = useAuth()

  if (!initialized) {
    return <Loader fullScreen label="Checking secure session" />
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  // If allowedRoles is specified, ensure the user has one of the roles.
  // "admin" role is treated as any admin (isAdmin flag) for backward compatibility.
  if (allowedRoles && !allowedRoles.includes(role) && !(allowedRoles.includes('admin' as UserRole) && isAdmin)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
