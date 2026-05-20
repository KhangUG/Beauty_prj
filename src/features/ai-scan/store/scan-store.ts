import { create } from 'zustand'
import { mockScanResult } from '@/shared/data/mock-scan'
import { type ScanResult } from '@/shared/lib/types'

type ScanPhase = 'idle' | 'uploading' | 'scanning' | 'complete'

type ScanStore = {
  phase: ScanPhase
  imagePreview: string | null
  scanResult: ScanResult | null
  setImagePreview: (preview: string | null) => void
  runFakeScan: () => Promise<void>
  reset: () => void
}

export const useScanStore = create<ScanStore>((set) => ({
  phase: 'idle',
  imagePreview: null,
  scanResult: null,
  setImagePreview: (imagePreview) => set({ imagePreview, phase: imagePreview ? 'uploading' : 'idle' }),
  runFakeScan: async () => {
    set({ phase: 'scanning' })
    await new Promise((resolve) => setTimeout(resolve, 2400))
    set({ phase: 'complete', scanResult: mockScanResult })
  },
  reset: () => set({ phase: 'idle', imagePreview: null, scanResult: null }),
}))
