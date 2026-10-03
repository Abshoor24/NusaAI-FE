import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api/projects'
import { ApiError } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'
import { setPendingImages } from '@/lib/pending-images'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Container } from '@/components/ui/container'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ImagePicker, type PickedImage } from '@/components/ImagePicker'
import type { ContentLanguage, CreateProjectRequest, WebsiteType } from '@/types/api'
import { X } from 'lucide-react'

export const Route = createFileRoute('/_app/projects/new')({
  component: NewProjectPage,
})

const WEBSITE_TYPES: Array<{ value: WebsiteType; label: string }> = [
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'portfolio', label: 'Portofolio' },
  { value: 'company_profile', label: 'Profil Perusahaan' },
  { value: 'online_store', label: 'Toko Online' },
  { value: 'blog', label: 'Blog' },
  { value: 'other', label: 'Lainnya' },
]

const MAX_SECTIONS = 12
const MAX_SECTION_LEN = 50

function NewProjectPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [websiteType, setWebsiteType] = useState<WebsiteType | ''>('')
  const [businessName, setBusinessName] = useState('')
  const [style, setStyle] = useState('')
  const [colorPalette, setColorPalette] = useState('')
  const [language, setLanguage] = useState<ContentLanguage | ''>('')
  const [sections, setSections] = useState<string[]>([])
  const [sectionInput, setSectionInput] = useState('')
  const [images, setImages] = useState<PickedImage[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectRequest) => projectsApi.create(payload),
    onSuccess: (project) => {
      // Gambar dibawa ke workspace lewat memori (tidak bertahan saat reload).
      if (images.length > 0) {
        setPendingImages(project.id, images.map((img) => img.file))
      }
      navigate({
        to: '/projects/$projectId',
        params: { projectId: project.id },
        search: images.length > 0 ? { autostart: '1', withImages: '1' } : { autostart: '1' },
      })
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors(err.fields)
        setFormError('Periksa kembali isian formulir Anda.')
      } else {
        setFormError(getErrorMessage(err))
      }
    },
  })

  const fieldError = (keys: string[]): string | undefined => {
    for (const key of keys) {
      if (fieldErrors[key]) return fieldErrors[key]
    }
    return undefined
  }

  const addSection = () => {
    const value = sectionInput.trim()
    if (!value) return
    if (sections.length >= MAX_SECTIONS) {
      setFieldErrors((prev) => ({ ...prev, sections: `Maksimal ${MAX_SECTIONS} bagian.` }))
      return
    }
    if (value.length > MAX_SECTION_LEN) {
      setFieldErrors((prev) => ({
        ...prev,
        sections: `Tiap bagian maksimal ${MAX_SECTION_LEN} karakter.`,
      }))
      return
    }
    if (sections.includes(value)) {
      setSectionInput('')
      return
    }
    setSections([...sections, value])
    setSectionInput('')
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.sections
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setFormError(null)

    const desc = description.trim()
    if (desc.length < 10) {
      setFieldErrors({ 'brief.description': 'Deskripsi minimal 10 karakter.' })
      return
    }
    if (desc.length > 4000) {
      setFieldErrors({ 'brief.description': 'Deskripsi maksimal 4000 karakter.' })
      return
    }

    // Field kosong dikirim sebagai tidak ada (omit), bukan string kosong.
    const payload: CreateProjectRequest = {
      brief: { description: desc },
    }
    const t = title.trim()
    if (t) {
      if (t.length > 200) {
        setFieldErrors({ title: 'Judul maksimal 200 karakter.' })
        return
      }
      payload.title = t
    }
    if (websiteType) payload.brief.website_type = websiteType
    const bn = businessName.trim()
    if (bn) payload.brief.business_name = bn.slice(0, 120)
    const st = style.trim()
    if (st) payload.brief.style = st.slice(0, 200)
    const cp = colorPalette.trim()
    if (cp) payload.brief.color_palette = cp.slice(0, 200)
    if (language) payload.brief.language = language
    if (sections.length > 0) payload.brief.sections = sections

    createMutation.mutate(payload)
  }

  const descError = fieldError(['brief.description', 'description'])

  return (
    <Container className="py-8 max-w-3xl">
      <div className="mb-6">
        <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground">
          &larr; Kembali ke Project Saya
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">
          Website seperti apa yang ingin kamu buat?
        </h1>
        <p className="text-sm text-muted-foreground">
          Jelaskan idemu. Setelah disimpan, AI langsung mulai membuatkan websitenya.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brief Website</CardTitle>
          <CardDescription>Semakin jelas deskripsimu, semakin bagus hasilnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">Judul Project (opsional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Website Kopi Senja"
                maxLength={200}
                disabled={createMutation.isPending}
              />
              {fieldError(['title']) && (
                <p className="text-[11px] text-destructive">{fieldError(['title'])}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Deskripsi Website *</Label>
                <span className="text-[11px] text-muted-foreground">
                  {description.trim().length}/4000
                </span>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="cth. Landing page untuk kedai kopi lokal di Purwokerto dengan menu, jam buka, lokasi, dan tombol pesan via WhatsApp."
                rows={5}
                disabled={createMutation.isPending}
              />
              {descError && <p className="text-[11px] text-destructive">{descError}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="website_type">Jenis Website</Label>
                <Select
                  id="website_type"
                  value={websiteType}
                  onChange={(e) => setWebsiteType(e.target.value as WebsiteType | '')}
                  disabled={createMutation.isPending}
                >
                  <option value="">Otomatis (landing page)</option>
                  {WEBSITE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                {fieldError(['brief.website_type']) && (
                  <p className="text-[11px] text-destructive">{fieldError(['brief.website_type'])}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Bahasa Konten</Label>
                <Select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ContentLanguage | '')}
                  disabled={createMutation.isPending}
                >
                  <option value="">Otomatis (Indonesia)</option>
                  <option value="id">Indonesia</option>
                  <option value="en">Inggris</option>
                </Select>
                {fieldError(['brief.language']) && (
                  <p className="text-[11px] text-destructive">{fieldError(['brief.language'])}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="business_name">Nama Bisnis / Brand</Label>
              <Input
                id="business_name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="cth. Kopi Senja"
                maxLength={120}
                disabled={createMutation.isPending}
              />
              {fieldError(['brief.business_name']) && (
                <p className="text-[11px] text-destructive">{fieldError(['brief.business_name'])}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="style">Gaya Visual</Label>
                <Input
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="cth. hangat, rustic, modern"
                  maxLength={200}
                  disabled={createMutation.isPending}
                />
                {fieldError(['brief.style']) && (
                  <p className="text-[11px] text-destructive">{fieldError(['brief.style'])}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color_palette">Warna</Label>
                <Input
                  id="color_palette"
                  value={colorPalette}
                  onChange={(e) => setColorPalette(e.target.value)}
                  placeholder="cth. cokelat kopi dan krem"
                  maxLength={200}
                  disabled={createMutation.isPending}
                />
                {fieldError(['brief.color_palette']) && (
                  <p className="text-[11px] text-destructive">{fieldError(['brief.color_palette'])}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sections">Bagian yang Diinginkan (maks {MAX_SECTIONS})</Label>
              <div className="flex gap-2">
                <Input
                  id="sections"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  placeholder="cth. hero, menu, testimoni — tekan Tambah"
                  maxLength={MAX_SECTION_LEN}
                  disabled={createMutation.isPending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSection()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSection} disabled={createMutation.isPending}>
                  Tambah
                </Button>
              </div>
              {sections.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sections.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                    >
                      {s}
                      <button
                        type="button"
                        aria-label={`Hapus bagian ${s}`}
                        onClick={() => setSections(sections.filter((x) => x !== s))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {fieldError(['brief.sections', 'sections']) && (
                <p className="text-[11px] text-destructive">{fieldError(['brief.sections', 'sections'])}</p>
              )}
            </div>

            <ImagePicker images={images} onChange={setImages} disabled={createMutation.isPending} />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              Simpan & Buatkan Website
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  )
}
