import { create } from 'zustand'
import { getLocalStorageItem, setLocalStorageItem } from '@/shared/lib/storage'

const ONBOARDING_KEY = 'lumina-onboarding-seen'

type UIStore = {
  recommendationModalOpen: boolean
  hasSeenScanOnboarding: boolean
  openRecommendationModal: () => void
  closeRecommendationModal: () => void
  markScanOnboardingSeen: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  recommendationModalOpen: false,
  hasSeenScanOnboarding: getLocalStorageItem(ONBOARDING_KEY, false),
  openRecommendationModal: () => set({ recommendationModalOpen: true }),
  closeRecommendationModal: () => set({ recommendationModalOpen: false }),
  markScanOnboardingSeen: () => {
    setLocalStorageItem(ONBOARDING_KEY, true)
    set({ hasSeenScanOnboarding: true })
  },
}))
