import { getLocalStorageItem, setLocalStorageItem } from '@/shared/lib/storage'

type SubscriptionMap = Record<string, string>

const SUBSCRIPTION_KEY = 'lumina_subscription_tiers'

export function getSubscriptionTier(userId: string) {
  const map = getLocalStorageItem<SubscriptionMap>(SUBSCRIPTION_KEY, {})
  return map[userId]
}

export function setSubscriptionTier(userId: string, tier: string) {
  const map = getLocalStorageItem<SubscriptionMap>(SUBSCRIPTION_KEY, {})
  map[userId] = tier
  setLocalStorageItem(SUBSCRIPTION_KEY, map)
}
