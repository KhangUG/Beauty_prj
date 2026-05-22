import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/shared/types/auth'
import { getLocalStorageItem, setLocalStorageItem } from '@/shared/lib/storage'

type ProfileOverride = {
  displayName?: string
  avatarUrl?: string
}

type ProfileMap = Record<string, ProfileOverride>

const PROFILE_KEY = 'lumina_profile_overrides'

export function getProfileOverride(userId: string) {
  const map = getLocalStorageItem<ProfileMap>(PROFILE_KEY, {})
  return map[userId]
}

export function setProfileOverride(userId: string, override: ProfileOverride) {
  const map = getLocalStorageItem<ProfileMap>(PROFILE_KEY, {})
  map[userId] = { ...(map[userId] ?? {}), ...override }
  setLocalStorageItem(PROFILE_KEY, map)
}

export function getDisplayName(profile: UserProfile | null, user: User | null, userId?: string) {
  const override = userId ? getProfileOverride(userId)?.displayName : undefined
  if (override?.trim()) return override.trim()

  const first = profile?.first_name?.trim() ?? ''
  const last = profile?.last_name?.trim() ?? ''
  const fullName = `${first} ${last}`.trim()
  if (fullName) return fullName

  const metaFirst = typeof user?.user_metadata?.first_name === 'string' ? user.user_metadata.first_name : ''
  const metaLast = typeof user?.user_metadata?.last_name === 'string' ? user.user_metadata.last_name : ''
  const metaName = `${metaFirst} ${metaLast}`.trim()
  if (metaName) return metaName

  return user?.email?.split('@')[0] ?? 'User'
}

export function getAvatarUrl(profile: UserProfile | null, user: User | null, userId?: string) {
  if (profile?.avatar_url?.trim()) return profile.avatar_url.trim()

  const metaAvatar =
    typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null
  if (metaAvatar?.trim()) return metaAvatar.trim()

  const override = userId ? getProfileOverride(userId)?.avatarUrl : undefined
  return override?.trim() || null
}

export function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}
