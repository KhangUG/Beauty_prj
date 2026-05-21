import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = {
  title?: string
  children: ReactNode
}

export default function MobileAccordion({ title = 'Show', children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        className="sm:hidden mb-3 flex w-full items-center justify-between rounded-xl border border-rose-100 bg-white/90 px-4 py-3 text-left text-sm font-semibold text-rose-700"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="inline-block h-4 w-4">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-rose-600">
              <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
            </svg>
          </span>
          <span>{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${open ? 'block' : 'hidden'} sm:block`}>{children}</div>
    </div>
  )
}
