import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authService } from '@/features/auth/services/auth-service'
import { storageService } from '@/services/supabase/storage-service'
import { getUserInitials } from '@/shared/lib/profile'
import { useToast } from '@/shared/hooks/useToast'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ProfilePage() {
  const { user, profile, role, isAdmin, displayName, avatarUrl, subscriptionTier, refreshProfile } = useAuth()
  const userId = user?.id ?? ''
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)

  useEffect(() => {
    setFirstName(profile?.first_name ?? '')
    setLastName(profile?.last_name ?? '')
  }, [profile?.first_name, profile?.last_name])

  useEffect(() => {
    if (profile?.avatar_url) {
      setPreviewAvatar(profile.avatar_url)
    }
  }, [profile?.avatar_url])

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Please sign in to update your profile.')
      return authService.updateProfile(userId, {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      })
    },
    onSuccess: async () => {
      await refreshProfile()
      toast.success('Profile updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not save profile')
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error('Please sign in to upload an avatar.')

      if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
        throw new Error('Please choose a JPG, PNG, or WebP image.')
      }

      if (file.size > MAX_AVATAR_BYTES) {
        throw new Error('Image must be smaller than 2MB.')
      }

      const avatarUrl = await storageService.uploadAvatar(userId, file)
      await authService.updateProfile(userId, { avatar_url: avatarUrl })
      return avatarUrl
    },
    onSuccess: async (avatarUrl) => {
      setPreviewAvatar(`${avatarUrl}?t=${Date.now()}`)
      await refreshProfile()
      toast.success('Avatar saved to your account')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not upload avatar')
    },
  })

  const handleAvatarPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreviewAvatar(objectUrl)
    uploadAvatarMutation.mutate(file, {
      onSettled: () => URL.revokeObjectURL(objectUrl),
    })
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (!user) {
    return (
      <section className="section-shell pb-16">
        <Card className="mx-auto max-w-lg border border-rose-100/60 bg-white/85 p-8 text-center">
          <h1 className="font-display text-2xl text-pearl">Profile</h1>
          <p className="mt-2 text-sm text-mist">Please sign in to manage your profile.</p>
          <Link to="/auth" className="mt-4 inline-block">
            <Button>Sign in</Button>
          </Link>
        </Card>
      </section>
    )
  }

  const currentAvatar = previewAvatar ?? avatarUrl
  const initials = getUserInitials(displayName)
  const isSaving = saveProfileMutation.isPending
  const isUploading = uploadAvatarMutation.isPending

  return (
    <section className="section-shell pb-16">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border border-rose-100/60 bg-white/85">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600">Profile</p>
          <h1 className="mt-2 font-display text-3xl text-pearl">Your account</h1>
          <p className="mt-2 text-sm text-mist">Update your avatar and personal details.</p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="border border-rose-100/60 bg-white/85 p-6 text-center">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="group relative mx-auto inline-flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-rose-100 bg-rose-50 transition hover:border-cyan/40"
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-bold text-rose-700">{initials}</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_AVATAR_TYPES.join(',')}
              className="hidden"
              onChange={handleAvatarPick}
            />
            <p className="mt-4 text-sm font-semibold text-rose-950">{displayName}</p>
            <p className="mt-1 text-xs text-mist">{user.email}</p>
            <p className="mt-3 text-[11px] text-mist">Click avatar to upload to Supabase (max 2MB)</p>
          </Card>

          <div className="space-y-4">
            <Card className="border border-rose-100/60 bg-white/85 p-6">
              <h2 className="font-display text-2xl text-pearl">Edit profile</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-rose-600">First name</label>
                  <Input
                    className="mt-2"
                    placeholder="First name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-rose-600">Last name</label>
                  <Input
                    className="mt-2"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => saveProfileMutation.mutate()} disabled={isSaving || isUploading}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </Card>

            <Card className="border border-rose-100/60 bg-white/85 p-6">
              <h2 className="font-display text-2xl text-pearl">Account details</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Email</dt>
                  <dd className="mt-1 text-sm text-rose-950 break-all">{profile?.email ?? user.email}</dd>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Role</dt>
                  <dd className="mt-1 text-sm capitalize text-rose-950">{role}</dd>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Try-on credits</dt>
                  <dd className="mt-1 text-sm text-rose-950">{profile?.try_on_credits ?? 0}</dd>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Last sign in</dt>
                  <dd className="mt-1 text-sm text-rose-950">{formatDateTime(user.last_sign_in_at)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="border border-rose-100/60 bg-white/85 p-6">
              <h2 className="font-display text-2xl text-pearl">Subscription</h2>
              <p className="mt-2 text-sm text-mist">Current plan: {subscriptionTier}</p>
              <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-900">
                Upgrade anytime to unlock more scans and longer history.
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/plans">
                  <Button>Manage plan</Button>
                </Link>
                <Link to="/scan">
                  <Button variant="ghost">Run a scan</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
