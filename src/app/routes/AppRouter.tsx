import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Loader } from '@/shared/components/ui/Loader'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'))
const AIScanPage = lazy(() => import('@/features/ai-scan/pages/AIScanPage'))
const RecommendationsPage = lazy(() => import('@/features/recommendations/pages/RecommendationsPage'))
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage'))
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const AdminPage = lazy(() => import('@/features/admin/pages/AdminPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/scan', element: <AIScanPage /> },
      { path: '/recommendations', element: <RecommendationsPage /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/auth', element: <AuthPage /> },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
])

export function AppRouter() {
  return (
    <Suspense fallback={<Loader fullScreen label="Loading your AI beauty suite" />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
