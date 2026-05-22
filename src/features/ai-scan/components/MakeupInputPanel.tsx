import { useState, type ChangeEvent } from 'react'
import { ChevronDown, ChevronUp, Link2, Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import type { MakeupEffect } from '@/features/ai-scan/types/makeup-vto'
import { DEFAULT_MAKEUP_EFFECTS, MAKEUP_CATEGORY_META, SAMPLE_SELFIE_URLS } from '@/features/ai-scan/lib/makeup-defaults'
import { cn } from '@/shared/lib/cn'

type InputMode = 'upload' | 'url' | 'sample'

type MakeupInputPanelProps = {
  imageSource: string
  effects: MakeupEffect[]
  isProcessing: boolean
  apiConfigured: boolean
  onImageChange: (value: string) => void
  onEffectsChange: (effects: MakeupEffect[]) => void
  onProcess: () => void
}

function cloneDefaults() {
  return DEFAULT_MAKEUP_EFFECTS.map((effect) => ({
    ...effect,
    palettes: effect.palettes?.map((palette) => ({ ...palette })),
    pattern: effect.pattern ? { ...effect.pattern } : undefined,
    shape: effect.shape ? { ...effect.shape } : undefined,
    style: effect.style ? { ...effect.style } : undefined,
    morphology: effect.morphology ? { ...effect.morphology } : undefined,
  }))
}

export function MakeupInputPanel({
  imageSource,
  effects,
  isProcessing,
  apiConfigured,
  onImageChange,
  onEffectsChange,
  onProcess,
}: MakeupInputPanelProps) {
  const [mode, setMode] = useState<InputMode>('sample')
  const [urlInput, setUrlInput] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const updateEffect = (category: string, patch: Partial<MakeupEffect>) => {
    onEffectsChange(
      effects.map((effect) => (effect.category === category ? { ...effect, ...patch } : effect)),
    )
  }

  const updatePalette = (category: string, patch: Partial<NonNullable<MakeupEffect['palettes']>[number]>) => {
    onEffectsChange(
      effects.map((effect) => {
        if (effect.category !== category) return effect
        const palettes = [...(effect.palettes ?? [{ color: '#FF0000', colorIntensity: 50 }])]
        palettes[0] = { ...palettes[0], ...patch }
        return { ...effect, palettes }
      }),
    )
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    onImageChange(URL.createObjectURL(file))
    setMode('upload')
  }

  const toggleCategory = (category: string) => {
    const effect = effects.find((item) => item.category === category)
    updateEffect(category, { enabled: !(effect?.enabled !== false) })
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-rose-100/60 bg-white/90 shadow-sm">
      <div className="shrink-0 border-b border-rose-100 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-rose-600">Input</p>
        <p className="mt-1 text-xs text-mist">Choose a selfie and configure makeup effects.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="flex border-b border-rose-100 text-xs">
        {(['url', 'upload', 'sample'] as InputMode[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMode(tab)}
            className={cn(
              'flex-1 px-3 py-2 font-semibold capitalize transition',
              mode === tab ? 'border-b-2 border-cyan text-cyan-700 bg-rose-50/50' : 'text-mist hover:text-rose-800',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3 border-b border-rose-100 p-4">
        {mode === 'upload' ? (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-rose-200 bg-rose-50/40 px-4 py-8 text-sm text-mist hover:border-rose-300">
            <Upload className="h-4 w-4" />
            Upload selfie (jpg/png)
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
          </label>
        ) : null}

        {mode === 'url' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-rose-500" />
              <Input
                placeholder="https://..."
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
              />
            </div>
            <Button size="sm" variant="ghost" onClick={() => urlInput.trim() && onImageChange(urlInput.trim())}>
              Use URL
            </Button>
          </div>
        ) : null}

        {mode === 'sample' ? (
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_SELFIE_URLS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => onImageChange(url)}
                className={cn(
                  'overflow-hidden rounded-xl border-2 transition',
                  imageSource === url ? 'border-cyan' : 'border-transparent hover:border-rose-200',
                )}
              >
                <img src={url} alt="Sample" className="h-24 w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        {imageSource ? (
          <img src={imageSource} alt="Selected" className="h-28 w-full rounded-xl object-cover border border-rose-100" />
        ) : null}
      </div>

      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-600">Category</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          {effects.map((effect) => {
            const meta = MAKEUP_CATEGORY_META[effect.category]
            const isOn = effect.enabled !== false
            return (
              <label key={effect.category} className="flex items-center gap-2 rounded-lg border border-rose-100 px-2 py-1.5">
                <input type="checkbox" checked={isOn} onChange={() => toggleCategory(effect.category)} />
                <span className="text-rose-900">{meta?.label ?? effect.category}</span>
              </label>
            )
          })}
        </div>

        <div className="mt-4 space-y-2">
          {effects
            .filter((effect) => effect.enabled !== false)
            .map((effect) => {
              const meta = MAKEUP_CATEGORY_META[effect.category]
              const palette = effect.palettes?.[0]
              const isOpen = expanded[effect.category] ?? false

              return (
                <div key={effect.category} className="rounded-xl border border-rose-100 bg-rose-50/30">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-rose-950"
                    onClick={() => setExpanded((state) => ({ ...state, [effect.category]: !isOpen }))}
                  >
                    {meta?.label ?? effect.category}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isOpen ? (
                    <div className="space-y-2 border-t border-rose-100 px-3 py-3 text-xs">
                      {effect.category === 'skin_smooth' ? (
                        <>
                          <label className="block text-mist">Smooth strength</label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={effect.skinSmoothStrength ?? 50}
                            onChange={(event) =>
                              updateEffect(effect.category, { skinSmoothStrength: Number(event.target.value) })
                            }
                            className="w-full"
                          />
                        </>
                      ) : (
                        <>
                          {meta?.hasPattern ? (
                            <div>
                              <label className="text-mist">Pattern</label>
                              <Input
                                className="mt-1 h-8 text-xs"
                                value={effect.pattern?.name ?? ''}
                                onChange={(event) =>
                                  updateEffect(effect.category, {
                                    pattern: { ...effect.pattern, name: event.target.value },
                                  })
                                }
                              />
                            </div>
                          ) : null}
                          {palette ? (
                            <>
                              <div className="flex items-center gap-2">
                                <label className="text-mist">Color</label>
                                <input
                                  type="color"
                                  value={palette.color}
                                  onChange={(event) => updatePalette(effect.category, { color: event.target.value })}
                                  className="h-8 w-10 cursor-pointer rounded border border-rose-200"
                                />
                                <Input
                                  className="h-8 flex-1 font-mono text-[10px]"
                                  value={palette.color}
                                  onChange={(event) => updatePalette(effect.category, { color: event.target.value })}
                                />
                              </div>
                              {meta?.hasTexture ? (
                                <div>
                                  <label className="text-mist">Texture</label>
                                  <select
                                    className="mt-1 w-full rounded-lg border border-rose-200 px-2 py-1.5"
                                    value={palette.texture ?? 'matte'}
                                    onChange={(event) =>
                                      updatePalette(effect.category, {
                                        texture: event.target.value as NonNullable<typeof palette.texture>,
                                      })
                                    }
                                  >
                                    <option value="matte">matte</option>
                                    <option value="satin">satin</option>
                                    <option value="shimmer">shimmer</option>
                                    <option value="gloss">gloss</option>
                                    <option value="metallic">metallic</option>
                                  </select>
                                </div>
                              ) : null}
                              <div>
                                <label className="text-mist">Intensity ({palette.colorIntensity ?? 50})</label>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={palette.colorIntensity ?? 50}
                                  onChange={(event) =>
                                    updatePalette(effect.category, { colorIntensity: Number(event.target.value) })
                                  }
                                  className="w-full"
                                />
                              </div>
                            </>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
        </div>
      </div>
      </div>

      <div className="shrink-0 border-t border-rose-100 bg-white/95 p-4">
        {!apiConfigured ? (
          <p className="mb-2 text-[10px] text-amber-700">
            Demo mode: set VITE_MAKEUP_API_KEY to call Perfect Corp API. Products still match your parameters.
          </p>
        ) : null}
        <Button className="w-full" onClick={onProcess} disabled={!imageSource || isProcessing}>
          {isProcessing ? 'Processing...' : 'Start Processing'}
        </Button>
        <button
          type="button"
          className="mt-2 w-full text-center text-[10px] text-mist underline"
          onClick={() => onEffectsChange(cloneDefaults())}
        >
          Reset parameters to default
        </button>
      </div>
    </div>
  )
}
