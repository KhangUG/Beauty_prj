import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getProfileOverride, setProfileOverride } from '@/shared/lib/profile'
import { useToast } from '@/shared/hooks/useToast'

export default function ProfilePage() {
  const { user, profile, subscriptionTier } = useAuth()
  const userId = user?.id ?? 'guest'
  const overrides = useMemo(() => getProfileOverride(userId), [userId])

  const [displayName, setDisplayName] = useState(overrides?.displayName ?? profile?.first_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(overrides?.avatarUrl ?? profile?.avatar_url ?? '')
  const toast = useToast()

  const handleSave = () => {
    setProfileOverride(userId, { displayName: displayName.trim(), avatarUrl: avatarUrl.trim() })
    toast.success('Profile saved')
  }

  return (
    <section className="section-shell pb-16">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border border-rose-100/60 bg-white/85">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600">Profile</p>
          <h1 className="mt-2 font-display text-3xl text-pearl">Account & subscription</h1>
          <p className="mt-2 text-sm text-mist">Manage your profile details and current plan.</p>
          {!user ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-xs text-rose-700">
              You are in guest mode. <Link to="/auth" className="font-semibold underline">Sign in</Link> to sync your profile across devices.
            </div>
          ) : null}
        </Card>

        <div className="grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
          <Card className="border border-rose-100/60 bg-white/85">
            <h2 className="font-display text-2xl text-pearl">Profile details</h2>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-rose-600">Display name</label>
                <Input
                  className="mt-2"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-rose-600">Avatar URL</label>
                <Input
                  className="mt-2"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleSave}>Save profile</Button>
              </div>
            </div>
          </Card>

          <Card className="border border-rose-100/60 bg-white/85">
            <h2 className="font-display text-2xl text-pearl">Subscription</h2>
            <p className="mt-2 text-sm text-mist">Current plan: {subscriptionTier?.toLowerCase() || 'free'}</p>
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-900">
              Upgrade anytime to unlock more scans and longer history.
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/checkout">
                <Button>Manage plan</Button>
              </Link>
              <Link to="/scan">
                <Button variant="ghost">Run a scan</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
