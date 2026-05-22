import { Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEffect, useMemo, useState } from 'react'
import { UserAccountMenu } from '@/shared/components/layout/UserAccountMenu'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/scan', label: 'AI Scan' },
  { to: '/recommendations', label: 'Recommendations' },
  { to: '/products', label: 'Products' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
]

export function AnimatedNavbar() {
  const { user, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const visibleNavItems = useMemo(() => {
    let items = isAdmin ? [...navItems, { to: '/admin', label: 'Admin' }] : [...navItems]
    if (user) {
      items = items.filter((item) => item.to !== '/profile')
    }
    return items
  }, [user, isAdmin])

  return (
    <motion.header
      className="fixed left-0 right-0 top-0 z-50 section-shell"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.3, 1] }}
    >
      <div className="glass-panel hidden sm:flex flex-wrap items-center justify-between gap-4 rounded-full px-5 py-3 shadow-[0_24px_70px_rgba(168,112,134,0.16)]">
        <NavLink to="/" className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.18em] text-pearl">
          <Sparkles className="h-4 w-4 text-cyan" />
          LUMINA AI
        </NavLink>
        <nav className="flex flex-wrap items-center gap-2 text-xs">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full border border-transparent px-3 py-1.5 transition',
                  isActive ? 'border-cyan/50 bg-rose-50 text-cyan' : 'text-mist hover:border-rose-200 hover:text-pearl',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <UserAccountMenu />
          ) : (
            <NavLink
              to="/auth"
              className={({ isActive }) =>
                cn(
                  'rounded-full border border-transparent px-3 py-1.5 transition',
                  isActive ? 'border-cyan/50 bg-rose-50 text-cyan' : 'text-mist hover:border-rose-200 hover:text-pearl',
                )
              }
            >
              Sign In
            </NavLink>
          )}
        </nav>
      </div>

      <div className="sm:hidden">
        <div className="flex items-center justify-between px-3 py-2">
          <button
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md p-2 text-rose-700 bg-white/90 shadow-sm"
            onClick={() => setMobileOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
            </svg>
          </button>
          {user ? <UserAccountMenu /> : null}
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-60 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white/95 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <NavLink to="/" className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.18em] text-rose-900">
                <Sparkles className="h-4 w-4 text-cyan" />
                LUMINA AI
              </NavLink>
              <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-1">
                <X className="h-5 w-5 text-rose-900" />
              </button>
            </div>

            {user ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                <p className="text-xs font-semibold text-rose-900">Account</p>
                <UserAccountMenu onNavigate={() => setMobileOpen(false)} />
              </div>
            ) : null}

            <nav className="mt-6 flex flex-col gap-3 text-sm">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-rose-800 hover:bg-rose-50"
                >
                  {item.label}
                </NavLink>
              ))}

              {!user ? (
                <NavLink to="/auth" onClick={() => setMobileOpen(false)} className="mt-3 rounded-md border px-3 py-2 text-rose-800">
                  Sign In
                </NavLink>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </motion.header>
  )
}
