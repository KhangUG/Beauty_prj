import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/scan', label: 'AI Scan' },
  { to: '/recommendations', label: 'Recommendations' },
  { to: '/products', label: 'Products' },
  { to: '/dashboard', label: 'Dashboard' },
]

export function AnimatedNavbar() {
  const { user, signOut } = useAuth()

  return (
    <motion.header
      className="sticky top-4 z-40 section-shell"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-full px-5 py-3">
        <NavLink to="/" className="flex items-center gap-2 font-display text-sm font-semibold tracking-[0.18em] text-pearl">
          <Sparkles className="h-4 w-4 text-cyan" />
          LUMINA AI
        </NavLink>
        <nav className="flex flex-wrap items-center gap-2 text-xs">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full border border-transparent px-3 py-1.5 transition',
                  isActive ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'text-mist hover:border-white/25 hover:text-pearl',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign Out
            </Button>
          ) : (
            <NavLink
              to="/auth"
              className={({ isActive }) =>
                cn(
                  'rounded-full border border-transparent px-3 py-1.5 transition',
                  isActive ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'text-mist hover:border-white/25 hover:text-pearl',
                )
              }
            >
              Sign In
            </NavLink>
          )}
        </nav>
      </div>
    </motion.header>
  )
}
