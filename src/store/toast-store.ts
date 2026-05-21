import { create } from 'zustand'

export type Toast = {
  id: string
  title?: string
  message: string
  type?: 'info' | 'success' | 'error'
}

type ToastStore = {
  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (t) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const toast = { id, ...t }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    return id
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))
