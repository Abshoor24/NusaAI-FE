import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BRIEF_TEXT_LIMITS } from '@/lib/brief/validate'
import type { BriefErrors } from '@/lib/brief/errors'

/** Target sentuh: 44px di layar kecil, kembali ke 40px di layar lebar. */
const TOUCH = 'min-h-control-min md:min-h-10'

interface ContactFieldsProps {
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
  disabled?: boolean
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'text' | 'tel' | 'email' | 'url'
  autoComplete?: string
  placeholder?: string
  example: string
  error?: string
  maxLength?: number
  disabled?: boolean
  multiline?: boolean
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  inputMode = 'text',
  autoComplete,
  placeholder,
  example,
  error,
  maxLength,
  disabled,
  multiline = false,
}: FieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  return (
    <div className="space-y-label">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={2}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          className="ctl min-h-24 w-full rounded-md border border-border-control md:min-h-16 bg-transparent px-control py-control-y text-control text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      ) : (
        <Input
          id={id}
          className={TOUCH}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
        />
      )}
      {error && (
        <p id={errorId} role="alert" className="text-hint text-destructive">
          {error}
        </p>
      )}
      <p id={hintId} className="text-hint text-zinc-600 dark:text-muted-foreground">
        Contoh: {example}
      </p>
    </div>
  )
}

/**
 * Input kontak terpisah dengan label & contoh. Nilai di sini HANYA dipakai
 * untuk membuat tautan WhatsApp/telepon/email/peta di website statis — tidak
 * pernah dikirim ke server selain brief.
 */
export function ContactFields({ contact, onChange, errors, disabled = false }: ContactFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-field-sm sm:grid-cols-2">
      <Field
        id="contact-whatsapp"
        label="Nomor WhatsApp"
        value={contact.whatsapp}
        onChange={(v) => onChange('whatsapp', v)}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="081234567890"
        example="081234567890"
        error={errors.whatsapp}
        disabled={disabled}
      />
      <Field
        id="contact-phone"
        label="Nomor telepon"
        value={contact.phone}
        onChange={(v) => onChange('phone', v)}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0271-123456"
        example="0271-123456"
        error={errors.phone}
        disabled={disabled}
      />
      <Field
        id="contact-email"
        label="Email"
        value={contact.email}
        onChange={(v) => onChange('email', v)}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="halo@contoh.id"
        example="halo@contoh.id"
        error={errors.email}
        disabled={disabled}
      />
      <Field
        id="contact-instagram"
        label="Instagram"
        value={contact.instagram}
        onChange={(v) => onChange('instagram', v)}
        placeholder="@namatoko"
        example="@namatoko"
        error={errors.instagram}
        disabled={disabled}
      />
      <Field
        id="contact-address"
        label="Alamat"
        value={contact.address}
        onChange={(v) => onChange('address', v)}
        placeholder="Jl. Melati No. 4, Semarang"
        example="nama jalan, nomor, kota"
        error={errors.address}
        maxLength={BRIEF_TEXT_LIMITS.address}
        disabled={disabled}
        multiline
      />
      <Field
        id="contact-maps-url"
        label="Tautan Google Maps"
        value={contact.mapsUrl}
        onChange={(v) => onChange('mapsUrl', v)}
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://maps.google.com/?q=alamat"
        example="https://maps.google.com/?q=alamat"
        error={errors.mapsUrl}
        disabled={disabled}
      />
      <Field
        id="contact-opening-hours"
        label="Jam buka"
        value={contact.openingHours}
        onChange={(v) => onChange('openingHours', v)}
        placeholder="Setiap hari, 08.00-22.00"
        example="Setiap hari, 08.00-22.00"
        error={errors.openingHours}
        maxLength={BRIEF_TEXT_LIMITS.openingHours}
        disabled={disabled}
      />
    </div>
  )
}