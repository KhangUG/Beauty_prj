import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-night px-6 text-center text-pearl">
          <div className="glass-panel max-w-lg rounded-3xl p-8">
            <h1 className="font-display text-3xl font-bold">AI Beauty Platform</h1>
            <p className="mt-4 text-mist">Something unexpected happened. Refresh to continue your scan journey.</p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
