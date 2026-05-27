import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Loader } from '@/shared/components/ui/Loader'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import PlanPage from '@/features/plans/pages/PlanPage'

const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'))
const AIScanPage = lazy(() => import('@/features/ai-scan/pages/AIScanPage'))
const RecommendationsPage = lazy(() => import('@/features/recommendations/pages/RecommendationsPage'))
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage'))
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const AdminPage = lazy(() => import('@/features/admin/pages/AdminPage'))
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/scan', element: <AIScanPage /> },
      { path: '/recommendations', element: <RecommendationsPage /> },
      { path: '/products', element: <ProductsPage /> },
      { path: '/plans', element: <PlanPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/auth', element: <AuthPage /> },
      { path: '/auth/verify', element: <VerifyEmailPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
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
          <ProtectedRoute allowedRoles={['admin']}>
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
