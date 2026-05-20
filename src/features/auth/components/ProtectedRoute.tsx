import { type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader } from '@/shared/components/ui/Loader'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { user, initialized, isLoading } = useAuth()

  if (!initialized || isLoading) {
    return <Loader fullScreen label="Checking secure session" />
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
