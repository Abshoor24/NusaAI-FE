import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { validateImageFiles, MAX_IMAGES_PER_REQUEST } from '@/lib/api/projects'
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

  // Revoke semua preview saat unmount.
  useEffect(() => {
    const current = images
    return () => {
      for (const img of current) URL.revokeObjectURL(img.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFiles = (files: FileList | File[]) => {
    const remaining = MAX_IMAGES_PER_REQUEST - images.length
    if (remaining <= 0) {
      setErrors([`Maksimal ${MAX_IMAGES_PER_REQUEST} gambar per permintaan.`])
      return
    }
    const { valid, errors: validationErrors } = validateImageFiles(Array.from(files))
    setErrors(validationErrors)
    const picked: PickedImage[] = valid.slice(0, remaining).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    if (valid.length > remaining) {
      setErrors((prev) => [...prev, `Hanya ${remaining} gambar pertama yang dipakai.`])
    }
    if (picked.length > 0) onChange([...images, ...picked])
  }

  const removeAt = (index: number) => {
    const target = images[index]
    if (target) URL.revokeObjectURL(target.previewUrl)
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
                aria-label={`Hapus gambar ${i + 1}`}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <X className="size-3.5" />
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
