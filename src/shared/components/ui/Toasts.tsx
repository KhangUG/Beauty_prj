import { useEffect } from 'react'
import { useToastStore } from '@/store/toast-store'

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.removeToast)

  useEffect(() => {
    const timers = toasts.map((t) => {
      const tm = setTimeout(() => remove(t.id), 4000)
      return () => clearTimeout(tm)
    })
    return () => timers.forEach((fn) => fn())
  }, [toasts, remove])

  if (!toasts.length) return null

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-sm rounded-lg px-4 py-3 shadow-lg transition-transform ${
            t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
          }`}
        >
          {t.title ? <div className="font-semibold">{t.title}</div> : null}
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  )
}
