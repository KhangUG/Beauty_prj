import { type PropsWithChildren } from 'react'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AppErrorBoundary } from '@/app/providers/AppErrorBoundary'
import { AuthBootstrap } from '@/app/providers/AuthBootstrap'
import { Toasts } from '@/shared/components/ui/Toasts'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <AuthBootstrap />
        <Toasts />
        {children}
      </QueryProvider>
    </AppErrorBoundary>
  )
}
