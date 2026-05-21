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
