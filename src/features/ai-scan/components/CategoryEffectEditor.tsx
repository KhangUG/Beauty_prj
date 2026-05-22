import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Input } from '@/shared/components/ui/Input'
import { Button } from '@/shared/components/ui/Button'
import { PatternPickerModal } from '@/features/ai-scan/components/PatternPickerModal'
import { usePatternCatalog } from '@/features/ai-scan/hooks/usePatternCatalog'
import type { MakeupEffect, MakeupPalette, MakeupTexture } from '@/features/ai-scan/types/makeup-vto'
import { MAKEUP_CATEGORY_META } from '@/features/ai-scan/lib/makeup-defaults'
import {
  applyPatternSelection,
  categoryNeedsPatternFirst,
  findPatternItem,
  getActivePatternLabel,
  getPatternColorCount,
  hasPatternCatalog,
  isPatternChosen,
  syncEffectPaletteCount,
} from '@/features/ai-scan/lib/makeup-patterns'
import { cn } from '@/shared/lib/cn'

type CategoryEffectEditorProps = {
  effect: MakeupEffect
  isOpen: boolean
  collapsible?: boolean
  onToggle: () => void
  onChange: (effect: MakeupEffect) => void
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="flex items-center gap-1 text-sm text-rose-950">
      {children}
      <HelpCircle className="h-3.5 w-3.5 text-mist" aria-hidden />
      {hint ? <span className="ml-auto text-xs font-normal text-mist">{hint}</span> : null}
    </label>
  )
}

function ColorPaletteFields({
  index,
  palette,
  showTexture,
  onChange,
}: {
  index: number
  palette: MakeupPalette
  showTexture?: boolean
  onChange: (patch: Partial<MakeupPalette>) => void
}) {
  return (
    <div className={cn('space-y-3', index > 0 && 'border-t border-rose-100 pt-4')}>
      <FieldLabel>Color {index + 1}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          className="h-9 font-mono text-sm"
          value={palette.color ?? '#FF0000'}
          onChange={(event) => onChange({ color: event.target.value })}
        />
        <input
          type="color"
          value={palette.color ?? '#FF0000'}
          onChange={(event) => onChange({ color: event.target.value })}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-transparent p-0 outline-none"
        />
      </div>

      <div>
        <FieldLabel hint="0~100">Color Intensity</FieldLabel>
        <Input
          type="number"
          min={0}
          max={100}
          className="mt-1 h-9"
          value={palette.colorIntensity ?? 50}
          onChange={(event) => onChange({ colorIntensity: Number(event.target.value) })}
        />
      </div>

      {showTexture ? (
        <div>
          <FieldLabel>Texture</FieldLabel>
          <select
            className="mt-1 h-9 w-full rounded-sm border border-rose-200 px-2 text-sm capitalize"
            value={palette.texture ?? 'matte'}
            onChange={(event) => onChange({ texture: event.target.value as MakeupTexture })}
          >
            {['matte', 'satin', 'shimmer', 'gloss', 'metallic'].map((texture) => (
              <option key={texture} value={texture}>
                {texture}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  )
}

export function CategoryEffectEditor({
  effect,
  isOpen,
  collapsible = true,
  onToggle,
  onChange,
}: CategoryEffectEditorProps) {
  const meta = MAKEUP_CATEGORY_META[effect.category]
  const [pickerOpen, setPickerOpen] = useState(false)
  const catalogQuery = usePatternCatalog(
    effect.category,
    (isOpen || pickerOpen) && hasPatternCatalog(effect.category),
  )
  const patternLabel = getActivePatternLabel(effect)
  const patternPreview = useMemo(
    () => findPatternItem(catalogQuery.data ?? [], patternLabel),
    [catalogQuery.data, patternLabel],
  )

  useEffect(() => {
    if (!catalogQuery.data?.length) return
    const synced = syncEffectPaletteCount(effect, catalogQuery.data)
    if ((synced.palettes?.length ?? 0) !== (effect.palettes?.length ?? 0)) {
      onChange(synced)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync palette slots when pattern/catalog changes
  }, [catalogQuery.data, effect.pattern?.name, effect.shape?.name, effect.category])

  const needsPattern = categoryNeedsPatternFirst(effect.category)
  const patternSelected = !needsPattern || isPatternChosen(effect)
  const paletteCount = getPatternColorCount(patternLabel, patternPreview)

  const updatePalette = (index: number, patch: Partial<MakeupPalette>) => {
    const palettes = [...(effect.palettes ?? [{ color: '#FF0000', colorIntensity: 50 }])]
    palettes[index] = { ...palettes[index], ...patch }
    onChange({ ...effect, palettes })
  }

  const showDetailFields = patternSelected

  return (
    <>
      <div className="rounded-lg border border-rose-100 bg-white">
        {collapsible ? (
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            onClick={onToggle}
          >
            <span className="text-sm font-semibold text-rose-950">{meta?.label ?? effect.category}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : (
          <div className="px-3 py-2.5">
            <span className="text-sm font-semibold text-rose-950">{meta?.label ?? effect.category}</span>
          </div>
        )}

        {isOpen ? (
          <div className="space-y-4 border-t border-rose-100 px-3 py-3">
            {effect.category === 'skin_smooth' ? (
              <>
                <div>
                  <FieldLabel hint="0~100">Smooth strength</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="mt-1 h-9"
                    value={effect.skinSmoothStrength ?? 50}
                    onChange={(event) =>
                      onChange({ ...effect, skinSmoothStrength: Number(event.target.value) })
                    }
                  />
                </div>
                <div>
                  <FieldLabel hint="0~100">Color intensity</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="mt-1 h-9"
                    value={effect.skinSmoothColorIntensity ?? 50}
                    onChange={(event) =>
                      onChange({ ...effect, skinSmoothColorIntensity: Number(event.target.value) })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                {hasPatternCatalog(effect.category) ? (
                  <div className="grid gap-2">
                    <FieldLabel>Pattern</FieldLabel>
                    {!patternSelected ? (
                      <>
                        <p className="text-xs leading-relaxed text-mist">
                          We support multiple application patterns. Click the button below to choose the pattern you
                          want.
                        </p>
                        <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mx-auto flex w-full border border-rose-200 bg-white"
                            onClick={() => setPickerOpen(true)}
                          >
                            Choose pattern
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3">
                        {patternPreview?.thumbnail ? (
                          <img
                            src={patternPreview.thumbnail}
                            alt={patternLabel ?? 'pattern'}
                            className="mx-auto h-24 w-24 object-contain"
                          />
                        ) : null}
                        <p className="mt-2 text-center text-sm font-medium text-rose-900">{patternLabel}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mx-auto mt-2 flex w-full max-w-[200px] border border-rose-200 bg-white"
                          onClick={() => setPickerOpen(true)}
                        >
                          Choose pattern
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}

                {showDetailFields && effect.category === 'eyebrows' ? (
                  <div className="grid gap-3">
                    <div>
                      <FieldLabel hint="0~100">Curvature</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.pattern?.curvature ?? 50}
                        onChange={(event) =>
                          onChange({
                            ...effect,
                            pattern: { ...effect.pattern, type: 'shape', curvature: Number(event.target.value) },
                          })
                        }
                      />
                    </div>
                    <div>
                      <FieldLabel hint="0~100">Thickness</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.pattern?.thickness ?? 50}
                        onChange={(event) =>
                          onChange({
                            ...effect,
                            pattern: { ...effect.pattern, thickness: Number(event.target.value) },
                          })
                        }
                      />
                    </div>
                    <div>
                      <FieldLabel hint="0~100">Definition</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.pattern?.definition ?? 50}
                        onChange={(event) =>
                          onChange({
                            ...effect,
                            pattern: { ...effect.pattern, definition: Number(event.target.value) },
                          })
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {showDetailFields && effect.category === 'concealer' ? (
                  <div className="space-y-3">
                    <ColorPaletteFields
                      index={0}
                      palette={effect.palettes?.[0] ?? { color: '#FBF5E9', colorIntensity: 50 }}
                      onChange={(patch) => updatePalette(0, patch)}
                    />
                    <div>
                      <FieldLabel hint="0~100">Under-eye intensity</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.palettes?.[0]?.colorUnderEyeIntensity ?? 50}
                        onChange={(event) => updatePalette(0, { colorUnderEyeIntensity: Number(event.target.value) })}
                      />
                    </div>
                    <div>
                      <FieldLabel hint="0~100">Coverage level</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.palettes?.[0]?.coverageLevel ?? 50}
                        onChange={(event) => updatePalette(0, { coverageLevel: Number(event.target.value) })}
                      />
                    </div>
                  </div>
                ) : null}

                {showDetailFields && effect.category === 'foundation' ? (
                  <div className="space-y-3">
                    <ColorPaletteFields
                      index={0}
                      palette={effect.palettes?.[0] ?? { color: '#EAC595', colorIntensity: 50 }}
                      onChange={(patch) => updatePalette(0, patch)}
                    />
                    <div>
                      <FieldLabel hint="0~100">Coverage intensity</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.palettes?.[0]?.coverageIntensity ?? 50}
                        onChange={(event) => updatePalette(0, { coverageIntensity: Number(event.target.value) })}
                      />
                    </div>
                    <div>
                      <FieldLabel hint="0~100">Glow intensity</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.palettes?.[0]?.glowIntensity ?? 0}
                        onChange={(event) => updatePalette(0, { glowIntensity: Number(event.target.value) })}
                      />
                    </div>
                  </div>
                ) : null}

                {showDetailFields && effect.category === 'lip_liner' ? (
                  <div className="space-y-3">
                    <ColorPaletteFields
                      index={0}
                      palette={effect.palettes?.[0] ?? { color: '#FF0000', texture: 'matte', colorIntensity: 50 }}
                      showTexture
                      onChange={(patch) => updatePalette(0, patch)}
                    />
                    <div>
                      <FieldLabel hint="0~100">Thickness</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.palettes?.[0]?.thickness ?? 50}
                        onChange={(event) => updatePalette(0, { thickness: Number(event.target.value) })}
                      />
                    </div>
                    <div>
                      <FieldLabel hint="0~100">Smoothness</FieldLabel>
                      <Input
                        type="number"
                        className="mt-1 h-9"
                        value={effect.palettes?.[0]?.smoothness ?? 50}
                        onChange={(event) => updatePalette(0, { smoothness: Number(event.target.value) })}
                      />
                    </div>
                  </div>
                ) : null}

                {showDetailFields &&
                !['skin_smooth', 'concealer', 'foundation', 'lip_liner'].includes(effect.category) ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-rose-950">Color</p>
                    {Array.from({ length: paletteCount }).map((_, index) => (
                      <ColorPaletteFields
                        key={index}
                        index={index}
                        palette={effect.palettes?.[index] ?? { color: '#FF0000', texture: 'matte', colorIntensity: 50 }}
                        showTexture={meta?.hasTexture}
                        onChange={(patch) => updatePalette(index, patch)}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <PatternPickerModal
        open={pickerOpen}
        effectCategory={effect.category}
        title={effect.category === 'lip_color' ? 'Choose lip shape' : 'Choose a pattern'}
        catalog={catalogQuery.data ?? []}
        isLoading={catalogQuery.isLoading}
        selectedLabel={patternLabel}
        onClose={() => setPickerOpen(false)}
        onChoose={(pattern) => {
          onChange(applyPatternSelection(effect, pattern))
          setPickerOpen(false)
        }}
      />
    </>
  )
}
