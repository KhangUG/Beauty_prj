import { useCallback } from 'react'
import { useToastStore } from '@/store/toast-store'

export function useToast() {
  const add = useToastStore((s) => s.addToast)
  const remove = useToastStore((s) => s.removeToast)

  const success = useCallback((message: string, title?: string) => add({ message, title, type: 'success' }), [add])
  const error = useCallback((message: string, title?: string) => add({ message, title, type: 'error' }), [add])
  const info = useCallback((message: string, title?: string) => add({ message, title, type: 'info' }), [add])

  return { success, error, info, remove }
}
