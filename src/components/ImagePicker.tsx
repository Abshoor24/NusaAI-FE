import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { validateImageFiles, MAX_IMAGES_PER_REQUEST } from '@/lib/api/projects'
import { createPreviewUrlRegistry } from '@/lib/preview-urls'
import { ImagePlus, X } from 'lucide-react'

export interface PickedImage {
  file: File
  previewUrl: string
}

interface ImagePickerProps {
  images: PickedImage[]
  onChange: (images: PickedImage[]) => void
  disabled?: boolean
}

/**
 * Input gambar referensi (opsional).
 * Validasi klien: maks 4 file, ≤10 MB per file, JPEG/PNG/WebP.
 * Pratinjau via URL.createObjectURL; URL di-revoke saat dihapus/unmount.
 */
export function ImagePicker({ images, onChange, disabled }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  // Registri URL hidup milik instance ini (tidak pernah menutup daftar
  // `images` yang basi). Dibuat sekali via lazy-init agar stabil.
  const registryRef = useRef<ReturnType<typeof createPreviewUrlRegistry> | null>(null)
  if (registryRef.current === null) {
    registryRef.current = createPreviewUrlRegistry()
  }
  // Timeout revoke yang tertunda (untuk membedakan unmount sungguhan
  // dari simulasi StrictMode di dev — lihat effect di bawah).
  const pendingRevokeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Bersihkan URL yang masih hidup saat unmount sungguhan.
  // Revoke ditunda satu tick: pada React StrictMode (dev), cleanup
  // simulasi langsung diikuti setup ulang, sehingga timeout sempat
  // dibatalkan dan URL yang masih tampil tidak ikut ter-revoke.
  useEffect(() => {
    if (pendingRevokeRef.current !== null) {
      clearTimeout(pendingRevokeRef.current)
      pendingRevokeRef.current = null
    }
    const registry = registryRef.current
    return () => {
      pendingRevokeRef.current = setTimeout(() => {
        pendingRevokeRef.current = null
        registry?.revokeAll()
      }, 0)
    }
  }, [])

  const addFiles = (files: FileList | File[]) => {
    const remaining = MAX_IMAGES_PER_REQUEST - images.length
    if (remaining <= 0) {
      setErrors([`Maksimal ${MAX_IMAGES_PER_REQUEST} gambar per permintaan.`])
      return
    }
    const { valid, errors: validationErrors } = validateImageFiles(Array.from(files))
    setErrors(validationErrors)
    const registry = registryRef.current
    const picked: PickedImage[] = valid.slice(0, remaining).map((file) => {
      const previewUrl = URL.createObjectURL(file)
      registry?.track(previewUrl)
      return { file, previewUrl }
    })
    if (valid.length > remaining) {
      setErrors((prev) => [...prev, `Hanya ${remaining} gambar pertama yang dipakai.`])
    }
    if (picked.length > 0) onChange([...images, ...picked])
  }

  const removeAt = (index: number) => {
    const target = images[index]
    // Revoke sekali via registri (aman dari revoke ganda).
    if (target) registryRef.current?.release(target.previewUrl)
    onChange(images.filter((_, i) => i !== index))
    setErrors([])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Gambar referensi (opsional, maks {MAX_IMAGES_PER_REQUEST})
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || images.length >= MAX_IMAGES_PER_REQUEST}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          Pilih gambar
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-[11px] text-destructive">
              {err}
            </li>
          ))}
        </ul>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="relative group rounded-lg overflow-hidden border border-border">
              <img
                src={img.previewUrl}
                alt={`Referensi ${i + 1}`}
                className="h-20 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label={`Hapus gambar ${img.file.name}`}
                title={`Hapus gambar ${img.file.name}`}
                className="absolute top-1 right-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/60 text-white transition-opacity md:min-h-0 md:min-w-0 md:size-7 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              >
                <X className="size-4 md:size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        JPEG, PNG, atau WebP. Maks 10 MB per gambar. Gambar hanya menjadi referensi untuk AI.
      </p>
    </div>
  )
}
