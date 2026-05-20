import { type PropsWithChildren } from 'react'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AppErrorBoundary } from '@/app/providers/AppErrorBoundary'
import { AuthBootstrap } from '@/app/providers/AuthBootstrap'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <AuthBootstrap />
        {children}
      </QueryProvider>
    </AppErrorBoundary>
  )
}
