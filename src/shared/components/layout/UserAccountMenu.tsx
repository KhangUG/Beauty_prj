import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useToast } from '@/shared/hooks/useToast'
import { getUserInitials } from '@/shared/lib/profile'
import { cn } from '@/shared/lib/cn'

type UserAccountMenuProps = {
  className?: string
  onNavigate?: () => void
}

export function UserAccountMenu({ className, onNavigate }: UserAccountMenuProps) {
  const { user, displayName, avatarUrl, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  if (!user) return null

  const initials = getUserInitials(displayName)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out')
      setOpen(false)
      onNavigate?.()
      navigate('/')
    } catch (error) {
      console.error('Sign out failed', error)
      toast.error('Sign out failed')
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-rose-200 bg-white shadow-sm transition hover:border-cyan/50 hover:ring-2 hover:ring-cyan/20"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-rose-700">{initials}</span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] min-w-[180px] overflow-hidden rounded-2xl border border-rose-100 bg-white py-1 shadow-[0_18px_50px_rgba(168,112,134,0.18)]">
          <div className="border-b border-rose-50 px-3 py-2">
            <p className="truncate text-xs font-semibold text-rose-950">{displayName}</p>
            <p className="truncate text-[10px] text-mist">{user.email}</p>
          </div>
          {isAdmin ? (
            <Link
              to="/admin"
              onClick={() => {
                setOpen(false)
                onNavigate?.()
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-rose-900 transition hover:bg-rose-50"
            >
              <LayoutDashboard className="h-4 w-4 text-cyan" />
              Admin
            </Link>
          ) : (
            <Link
              to="/profile"
              onClick={() => {
                setOpen(false)
                onNavigate?.()
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-rose-900 transition hover:bg-rose-50"
            >
              <UserRound className="h-4 w-4 text-cyan" />
              Profile
            </Link>
          )}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-rose-900 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4 text-rose-600" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
