import { type ScanResult } from '@/shared/lib/types'

export const mockScanResult: ScanResult = {
  skinScore: 86,
  acne: { label: 'Acne', value: 22, status: 'moderate' },
  hydration: { label: 'Hydration', value: 78, status: 'great' },
  oiliness: { label: 'Oiliness', value: 64, status: 'moderate' },
  darkCircles: { label: 'Dark Circles', value: 36, status: 'attention' },
}
