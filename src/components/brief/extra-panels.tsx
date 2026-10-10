import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImagePicker, type PickedImage } from '@/components/ImagePicker'
import { ContactFields } from './contact-fields'
import { ChipGroup } from './chip-group'
import { SegmentedControl } from './segmented-control'
import { X } from 'lucide-react'
import { API_LIMITS, MAX_SECTIONS, MAX_STYLES, type BusinessCategoryId } from '@/lib/brief/types'
import type { BriefErrors } from '@/lib/brief/errors'
import type { ContentLanguage } from '@/types/api'

/**
 * Isi kelompok accordion yang TIDAK terlihat saat halaman dibuka pertama kali:
 * "Tampilan" (gaya & bahasa), "Isi halaman" (toggle bagian), "Kontak", dan
 * "Gambar referensi".
 *
 * Dipisah ke modul sendiri agar projects.new.tsx bisa memuatnya secara lazy:
 *saat render pertama, yang dibutuhkan hanya kelompok pertama yang terbuka
 * sehingga chunk route tetap ramping.
 */

// ── 3. Isi halaman ───────────────────────────────────────────────────────────

export interface SectionsPanelProps {
  category: BusinessCategoryId | ''
  enabled: string[]
  onResetToSuggestion: () => void
  onResetAll: () => void
  disabled: boolean
  /** Baris toggle katalog (dirender oleh pemanggil bila perlu lazy split). */
  catalogToggles: React.ReactNode
  /** Error validasi bagian kustom (bukan toggle). */
  sectionError: string | null
  sectionInput: string
  onSectionInputChange: (value: string) => void
  onAddSection: () => void
  customSections: string[]
  onRemoveSection: (value: string) => void
}

export function SectionsPanel(props: SectionsPanelProps) {
  const {
    enabled,
    onResetToSuggestion,
    onResetAll,
    disabled,
    catalogToggles,
    sectionError,
    sectionInput,
    onSectionInputChange,
    onAddSection,
    customSections,
    onRemoveSection,
  } = props

  return (
    <div className="space-y-field">
      {catalogToggles}
      {enabled.length >= MAX_SECTIONS && (
        <p className="text-hint text-amber-800 dark:text-amber-300">
          Sudah mencapai batas {MAX_SECTIONS} bagian. Matikan salah satu untuk menyalakan yang lain.
        </p>
      )}
      <div className="flex flex-wrap gap-stack-sm">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !props.category}
          onClick={onResetToSuggestion}
        >
          Atur ulang ke saran
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onResetAll}>
          Mulai dari awal
        </Button>
      </div>

      <details className="rounded-lg border border-border bg-muted/30 p-control">
        <summary className="ctl min-h-control-min cursor-pointer text-control font-medium text-foreground">
          Lanjutan: tambah bagian sendiri
        </summary>
        <div className="mt-control space-y-label">
          <Label htmlFor="sections">Tambah bagian lain</Label>
          <div className="flex flex-col gap-stack-sm sm:flex-row">
            <Input
              id="sections"
              className="min-h-11 md:min-h-10"
              value={sectionInput}
              maxLength={API_LIMITS.sectionName}
              disabled={disabled}
              placeholder="cth. promo Ramadan, tekan Tambah"
              onChange={(e) => onSectionInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAddSection()
                }
              }}
              aria-invalid={Boolean(sectionError)}
              aria-describedby={sectionError ? 'sections-custom-error' : undefined}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onAddSection}
              disabled={disabled}
              className="min-h-11 md:min-h-10"
            >
              Tambah
            </Button>
          </div>
          {sectionError && (
            <p id="sections-custom-error" role="alert" className="text-hint text-destructive">
              {sectionError}
            </p>
          )}
          {customSections.length > 0 && (
            <div className="flex flex-wrap gap-stack-sm pt-stack-sm">
              {customSections.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-stack-sm rounded-full bg-muted px-2.5 py-1 text-hint"
                >
                  {value}
                  <button
                    type="button"
                    aria-label={`Hapus bagian ${value}`}
                    disabled={disabled}
                    onClick={() => onRemoveSection(value)}
                    className="ctl min-h-control-min min-w-control-min text-muted-foreground hover:text-foreground md:min-h-0 md:min-w-0"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

// ── 2. Gaya & bahasa ─────────────────────────────────────────────────────────

export interface StyleLanguagePanelProps {
  styles: string[]
  options: readonly string[]
  onToggleStyle: (value: string) => void
  language: ContentLanguage | ''
  onLanguageChange: (value: ContentLanguage | '') => void
  disabled: boolean
}

const LANGUAGE_OPTIONS: Array<{ value: ContentLanguage | ''; label: string; hint: string }> = [
  { value: '', label: 'Otomatis', hint: 'Ikuti bahasa deskripsi (biasanya Indonesia).' },
  { value: 'id', label: 'Indonesia', hint: 'Semua tulisan dalam bahasa Indonesia.' },
  { value: 'en', label: 'Inggris', hint: 'Semua tulisan dalam bahasa Inggris.' },
]

export function StyleLanguagePanel({
  styles,
  options,
  onToggleStyle,
  language,
  onLanguageChange,
  disabled,
}: StyleLanguagePanelProps) {
  return (
    <div className="space-y-group">
      <div className="space-y-label">
        <div className="flex items-baseline justify-between gap-stack-sm">
          <span id="label-gaya" className="text-control font-medium text-foreground">
            Gaya tampilan
          </span>
          <span className="text-hint text-zinc-600 dark:text-muted-foreground">
            {styles.length}/{MAX_STYLES} dipilih
          </span>
        </div>
        <ChipGroup
          name="styles"
          legendId="label-gaya"
          options={options}
          selected={styles}
          onToggle={onToggleStyle}
          max={MAX_STYLES}
          disabled={disabled}
        />
        <p className="text-xs text-zinc-600 dark:text-muted-foreground">
          Pilih maksimal {MAX_STYLES}. Setelah penuh, gaya lain dinonaktifkan.
        </p>
      </div>

      <div className="space-y-label">
        <span id="label-bahasa" className="text-control font-medium text-foreground">
          Bahasa tulisan website
        </span>
        <SegmentedControl
          name="language"
          legendId="label-bahasa"
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={onLanguageChange}
          disabled={disabled}
        />
        <p className="text-xs text-zinc-600 dark:text-muted-foreground">
          Website hasil generate tidak punya formulir, login, atau keranjang. Kontak memakai tombol
          WhatsApp, telepon, atau email.
        </p>
      </div>
    </div>
  )
}

// ── 4. Kontak ────────────────────────────────────────────────────────────────

export interface ContactPanelProps {
  contact: {
    whatsapp: string
    phone: string
    email: string
    address: string
    mapsUrl: string
    instagram: string
    openingHours: string
  }
  onChange: (field: string, value: string) => void
  errors: BriefErrors
  disabled: boolean
}

export function ContactPanel({ contact, onChange, errors, disabled }: ContactPanelProps) {
  return (
    <div className="space-y-field">
      <p className="text-hint text-zinc-600 dark:text-muted-foreground">
        Dipakai untuk tombol WhatsApp, telepon, email, dan tautan lokasi di website. Semua opsional.
        Isi yang paling sering dibutuhkan pelangganmu.
      </p>
      <ContactFields
        contact={contact}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    </div>
  )
}

// ── 5. Gambar referensi ─────────────────────────────────────────────────────

export interface ImagesPanelProps {
  images: PickedImage[]
  onChange: (images: PickedImage[]) => void
  disabled: boolean
}

export function ImagesPanel({ images, onChange, disabled }: ImagesPanelProps) {
  return (
    <div className="space-y-stack">
      <ImagePicker images={images} onChange={onChange} disabled={disabled} />
      <p className="rounded-lg border border-border bg-muted/40 p-control text-hint text-zinc-600 dark:text-muted-foreground">
        Catatan jujur: gambar ini hanya dipakai AI sebagai panduan gaya (warna, tata letak, suasana).
        Gambar tidak ikut muncul di website hasil, dan tidak menjadi logo.
      </p>
    </div>
  )
}