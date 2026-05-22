import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import type { PatternCatalogItem } from '@/features/ai-scan/lib/makeup-patterns'
import { getPatternTabGroups, isColorPatternCategory } from '@/features/ai-scan/lib/makeup-patterns'
import { cn } from '@/shared/lib/cn'

const COLOR_TAB_LABELS = ['1 color', '2 colors', '3 colors'] as const

type PatternPickerModalProps = {
  open: boolean
  title?: string
  effectCategory?: string
  catalog: PatternCatalogItem[]
  isLoading: boolean
  selectedLabel?: string
  onClose: () => void
  onChoose: (pattern: PatternCatalogItem) => void
}

export function PatternPickerModal({
  open,
  title = 'Choose a pattern',
  effectCategory,
  catalog,
  isLoading,
  selectedLabel,
  onClose,
  onChoose,
}: PatternPickerModalProps) {
  const [search, setSearch] = useState('')
  const [pendingLabel, setPendingLabel] = useState(selectedLabel)
  const isColorCategory = isColorPatternCategory(effectCategory)

  const tabGroups = useMemo(() => {
    if (isColorCategory && catalog.length === 0) {
      return COLOR_TAB_LABELS.map((name) => ({ name, items: [] as PatternCatalogItem[] }))
    }
    return getPatternTabGroups(catalog, effectCategory)
  }, [catalog, effectCategory, isColorCategory])

  const [activeTab, setActiveTab] = useState<string>(COLOR_TAB_LABELS[0])
  const wasOpenRef = useRef(false)
  const catalogSyncedRef = useRef(false)

  const resolveInitialTab = () => {
    if (catalog.length > 0 && selectedLabel) {
      const tabForSelection = getPatternTabGroups(catalog, effectCategory).find((tab) =>
        tab.items.some((item) => item.label === selectedLabel),
      )
      if (tabForSelection) return tabForSelection.name
    }
    if (isColorCategory) return COLOR_TAB_LABELS[0]
    return tabGroups[0]?.name ?? COLOR_TAB_LABELS[0]
  }

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      catalogSyncedRef.current = false
      return
    }

    const justOpened = !wasOpenRef.current
    wasOpenRef.current = true

    if (justOpened) {
      setPendingLabel(selectedLabel)
      setSearch('')
      catalogSyncedRef.current = catalog.length > 0
      setActiveTab(resolveInitialTab())
      return
    }

    if (!catalogSyncedRef.current && catalog.length > 0) {
      catalogSyncedRef.current = true
      setActiveTab(resolveInitialTab())
    }
  }, [open, catalog, selectedLabel, tabGroups, effectCategory, isColorCategory])

  const filteredItems = useMemo(() => {
    const group = tabGroups.find((tab) => tab.name === activeTab)?.items ?? catalog
    const query = search.trim().toLowerCase()
    if (!query) return group
    return group.filter((item) => item.label.toLowerCase().includes(query))
  }, [activeTab, catalog, search, tabGroups])

  const showTabBar = isColorCategory || tabGroups.length > 1

  if (!open) return null

  const pending = catalog.find((item) => item.label === pendingLabel)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-rose-100 px-4 py-3">
          <h3 className="shrink-0 text-lg font-semibold text-rose-950">{title}</h3>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <Input
              className="h-9 pl-9"
              placeholder="Search..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-mist hover:bg-rose-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {showTabBar ? (
          <div
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-rose-200 bg-rose-50/40 px-4"
            role="tablist"
          >
            {(isColorCategory ? COLOR_TAB_LABELS : tabGroups.map((tab) => tab.name)).map((tabName) => {
              const tab = tabGroups.find((group) => group.name === tabName)
              const count = tab?.items.length ?? 0
              const active = activeTab === tabName
              return (
                <button
                  key={tabName}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tabName)}
                  className={cn(
                    'relative shrink-0 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
                    active ? 'text-rose-600' : 'text-rose-900/80 hover:text-rose-600',
                  )}
                >
                  {tabName}
                  {isColorCategory && count > 0 ? (
                    <span className="ml-1 text-xs font-normal text-mist">({count})</span>
                  ) : null}
                  {active ? (
                    <span className="absolute right-2 bottom-0 left-2 h-0.5 rounded-full bg-rose-500" />
                  ) : null}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-mist">Loading patterns...</p>
          ) : filteredItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-mist">No patterns in this tab.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {filteredItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setPendingLabel(item.label)}
                  className={cn(
                    'rounded-lg border p-1 transition',
                    pendingLabel === item.label
                      ? 'border-rose-500 ring-2 ring-rose-200'
                      : 'border-rose-100 hover:border-rose-300',
                  )}
                >
                  <img src={item.thumbnail} alt={item.label} className="aspect-square w-full rounded object-cover" />
                  <p className="mt-1 truncate text-center text-[10px] text-rose-800">{item.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-rose-100 px-4 py-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!pending}
            onClick={() => {
              if (pending) onChoose(pending)
            }}
          >
            Choose
          </Button>
        </div>
      </div>
    </div>
  )
}
