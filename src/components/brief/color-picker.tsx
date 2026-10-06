import { useId } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PALETTE_PRESETS } from '@/lib/brief/palettes'
import { describeColor, isHexColor, normalizeHex } from '@/lib/brief/color-names'
import { cn } from '@/lib/utils/cn'

interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  example?: string
}

/**
 * Satu field warna: <input type="color"> bawaan browser + kolom hex yang
 * tersinkron dua arah. Nama warna selalu ditampilkan sebagai TEKS, jadi
 * makna tidak hanya disampaikan lewat warna (Aturan Aksesibilitas).
 */
export function ColorField({ label, value, onChange, error, disabled, example }: ColorFieldProps) {
  const id = useId()
  const textId = `${id}-hex`
  const errorId = `${id}-error`
  const valid = isHexColor(value)
  const described = describeColor(valid ? value : '')

  return (
    <div className="space-y-1.5">
      <Label htmlFor={textId}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — pemilih warna`}
          value={normalizeHex(value) ?? '#000000'}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          id={textId}
          value={value}
          disabled={disabled}
          placeholder="#6F4E37"
          spellCheck={false}
          autoComplete="off"
          inputMode="text"
          maxLength={7}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn('min-h-11 md:min-h-10', error && 'border-destructive')}
        />
      </div>
      <p className="text-xs text-zinc-600 dark:text-muted-foreground">
        {described ? `Terlihat sebagai ${described.name}` : 'Masukkan kode warna seperti #6F4E37'}
        {example ? ` — contoh: ${example}` : ''}
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

interface ColorPickerProps {
  mode: 'ai' | 'custom'
  onModeChange: (mode: 'ai' | 'custom') => void
  primaryColor: string
  accentColor: string
  onPrimaryChange: (value: string) => void
  onAccentChange: (value: string) => void
  palettePreset: string
  onPaletteChange: (id: string) => void
  errors: { primaryColor?: string; accentColor?: string }
  disabled?: boolean
}

/** Blok "Warna": pilihan AI, dua palet siap pakai, atau dua warna manual. */
export function ColorPicker({
  mode,
  onModeChange,
  primaryColor,
  accentColor,
  onPrimaryChange,
  onAccentChange,
  palettePreset,
  onPaletteChange,
  errors,
  disabled = false,
}: ColorPickerProps) {
  const groupId = useId()
  const primary = describeColor(primaryColor)
  const accent = describeColor(accentColor)

  return (
    <div className="space-y-4">
      <fieldset role="radiogroup" aria-labelledby={`${groupId}-mode`} className="min-w-0">
        <legend id={`${groupId}-mode`} className="mb-2 text-sm font-medium text-foreground">
          Sumber warna
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              { value: 'ai' as const, label: 'Biar AI yang memilih', hint: 'Paling mudah. AI memilih warna yang cocok dengan jenis usaha.' },
              { value: 'custom' as const, label: 'Pilih sendiri', hint: 'Tentukan warna utama dan warna aksen.' },
            ]
          ).map((option) => (
            <label
              key={option.value}
              // `relative`: input sr-only di dalamnya tidak boleh lolos ke <main>.
              className={cn(
                'relative flex min-h-[44px] cursor-pointer items-start gap-2 rounded-lg border border-border bg-card p-3 transition-colors',
                'has-[:checked]:border-primary has-[:checked]:bg-primary/5',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
              )}
            >
              <input
                type="radio"
                name={`${groupId}-mode`}
                value={option.value}
                checked={mode === option.value}
                disabled={disabled}
                onChange={() => onModeChange(option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                  mode === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
                )}
              >
                {mode === option.value && <Check className="size-3" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                <span className="mt-0.5 block text-xs text-zinc-600 dark:text-muted-foreground">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {mode === 'custom' && (
        <div className="space-y-4">
          <fieldset role="group" aria-labelledby={`${groupId}-palette`} className="min-w-0">
            <legend id={`${groupId}-palette`} className="mb-2 text-sm font-medium text-foreground">
              Palet siap pakai
            </legend>
            <div className="flex flex-wrap gap-2">
              {PALETTE_PRESETS.map((palette) => {
                const active = palettePreset === palette.id
                return (
                  <button
                    key={palette.id}
                    type="button"
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={() => {
                      onPaletteChange(palette.id)
                      onPrimaryChange(palette.primary)
                      onAccentChange(palette.accent)
                    }}
                    className={cn(
                      'flex min-h-[44px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      active
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary/40',
                    )}
                  >
                    <span aria-hidden="true" className="flex overflow-hidden rounded">
                      <span className="block size-4" style={{ backgroundColor: palette.primary }} />
                      <span className="block size-4" style={{ backgroundColor: palette.accent }} />
                    </span>
                    {palette.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField
              label="Warna utama"
              value={primaryColor}
              onChange={onPrimaryChange}
              error={errors.primaryColor}
              disabled={disabled}
              example="warna dominate"
            />
            <ColorField
              label="Warna aksen"
              value={accentColor}
              onChange={onAccentChange}
              error={errors.accentColor}
              disabled={disabled}
              example="warna tombol"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium text-foreground">Pratinjau kombinasi</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-10 overflow-hidden rounded"
              >
                <span className="block w-3/4" style={{ backgroundColor: primary?.hex ?? primaryColor }} />
                <span className="block w-1/4" style={{ backgroundColor: accent?.hex ?? accentColor }} />
              </span>
              <span className="text-xs text-zinc-600 dark:text-muted-foreground">
                {primary ? `utama ${primary.name}` : 'utama belum valid'}
                {' · '}
                {accent ? `aksen ${accent.name}` : 'aksen belum valid'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}