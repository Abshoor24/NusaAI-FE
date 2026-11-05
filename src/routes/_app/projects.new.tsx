import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api/projects'
import { ApiError } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'
import { setPendingImages } from '@/lib/pending-images'
import { setUnauthorizedHandler } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RotateCcw } from 'lucide-react'
import type { PickedImage } from '@/components/ImagePicker'
import { RadioCards } from '@/components/brief/radio-cards'
import { SectionToggles } from '@/components/brief/section-toggles'
import { BriefAccordion } from '@/components/brief/brief-accordion'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useAccordionIds } from '@/hooks/use-accordion-ids'
import type { CreateProjectRequest } from '@/types/api'
import {
  API_LIMITS,
  BUSINESS_CATEGORY_OPTIONS,
  BRIEF_GOAL_OPTIONS,
  WEBSITE_TYPE_OPTIONS,
  MAX_SECTIONS,
  MAX_STYLES,
  MAX_USER_DESCRIPTION,
  STYLE_OPTIONS,
  applyTemplate,
  buildProjectPayload,
  computeCompleteness,
  createEmptyBrief,
  defaultSectionsFor,
  getTemplate,
  loadBriefDraft,
  loadSelectedTemplate,
  saveBriefDraft,
  saveSelectedTemplate,
  sectionLabel,
  suggestWebsiteType,
  validateBrief,
  SECTION_CATALOG,
  clearBriefDraft,
  type BriefDraft,
  type BriefFieldName,
} from '@/lib/brief'

/**
 * Chunk berat dimuat saat dibutuhkan (route chunk harus tetap ramping).
 * - TemplatePicker menarik 6 template + ikon lucide-nya.
 * - ColorPicker menarik tabel palet & UI pemilih warna.
 * - Isi kelompok accordion yang tertutup (gaya/bahasa, bagian, kontak, gambar).
 * Semuanya dibungkus <Suspense> dengan fallback teks, jadi tidak ada layout
 * yang bergeser dan tidak ada ketergantensi runtime baru.
 */
const TemplatePicker = lazy(async () => ({
  default: (await import('@/components/brief/template-picker')).TemplatePicker,
}))
const ColorPicker = lazy(async () => ({
  default: (await import('@/components/brief/color-picker')).ColorPicker,
}))
const StyleLanguagePanel = lazy(async () => ({
  default: (await import('@/components/brief/extra-panels')).StyleLanguagePanel,
}))
const SectionsPanel = lazy(async () => ({
  default: (await import('@/components/brief/extra-panels')).SectionsPanel,
}))
const ContactPanel = lazy(async () => ({
  default: (await import('@/components/brief/extra-panels')).ContactPanel,
}))
const ImagesPanel = lazy(async () => ({
  default: (await import('@/components/brief/extra-panels')).ImagesPanel,
}))

export const Route = createFileRoute('/_app/projects/new')({
  validateSearch: (search: Record<string, unknown>): { template?: string } => ({
    template: typeof search.template === 'string' ? search.template : undefined,
  }),
  component: NewProjectPage,
})

type AccordionId = 'about' | 'tampilan' | 'sections' | 'contact' | 'images'

/** Group accordion tempat field tertentu (dipakai 3.8 untuk membuka error). */
const FIELD_GROUP: Partial<Record<BriefFieldName, AccordionId>> = {
  description: 'about',
  title: 'about',
  brandName: 'about',
  audience: 'about',
  primaryColor: 'tampilan',
  accentColor: 'tampilan',
  whatsapp: 'contact',
  phone: 'contact',
  email: 'contact',
  address: 'contact',
  mapsUrl: 'contact',
  instagram: 'contact',
  openingHours: 'contact',
  extraNotes: 'about',
}

function NewProjectPage() {
  useDocumentTitle('Buat Website Baru | Nusa AI')
  const navigate = useNavigate()
  const search = Route.useSearch?.() ?? {}
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  const firstRender = useRef(true)
  const appliedSearchTemplateRef = useRef(false)

  const [draft, setDraft] = useState<BriefDraft>(() => loadBriefDraft() ?? createEmptyBrief())
  const [templateId, setTemplateId] = useState<string>(() => loadSelectedTemplate())

  useEffect(() => {
    if (search.template && !appliedSearchTemplateRef.current) {
      appliedSearchTemplateRef.current = true
      const t = getTemplate(search.template)
      if (t) {
        setDraft((current) => applyTemplate(current, t))
        setTemplateId(t.id)
        saveSelectedTemplate(t.id)
      }
    }
  }, [search.template])

  const [images, setImages] = useState<PickedImage[]>([])
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BriefFieldName, string>>>({})
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sectionInput, setSectionInput] = useState('')
  const [sectionError, setSectionError] = useState<string | null>(null)
  // Dipakai 3.5: setelah user mengubah toggle manual, ganti kategori tidak
  // boleh menimpa pilihannya.
  const [sectionsTouched, setSectionsTouched] = useState(false)

  const [openIds, toggleAccordion, setOpenIds] = useAccordionIds(['about'])

  const update = useCallback(
    <K extends keyof BriefDraft>(key: K, value: BriefDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }))
    },
    [],
  )

  const updateContact = useCallback((field: string, value: string) => {
    setDraft((current) => ({
      ...current,
      contact: { ...current.contact, [field]: value },
    }))
  }, [])

  const clearError = useCallback((field: BriefFieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  // Draf disimpan per tab (sessionStorage), tanpa gambar.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    saveBriefDraft(draft)
    saveSelectedTemplate(templateId)
  }, [draft, templateId])

  // Hapus draf saat 401 global (sesi berakhir) — data kontak tidak boleh
  // tertinggal di perangkat.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearBriefDraft()
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const errors = useMemo(() => validateBrief(draft), [draft])
  const mergedErrors = useMemo(
    () => ({ ...errors, ...fieldErrors }),
    [errors, fieldErrors],
  )
  const completeness = useMemo(() => computeCompleteness(draft), [draft])

  const preview = useMemo(() => buildProjectPayload(draft), [draft])

  const selectTemplate = useCallback(
    (id: string) => {
      const template = getTemplate(id)
      if (!template) return
      setDraft((current) => applyTemplate(current, template))
      setTemplateId(id)
      saveSelectedTemplate(id)
    },
    [],
  )

  const jump = useCallback((stepNumber: number) => {
    const map: Record<number, AccordionId> = {
      1: 'about',
      2: 'tampilan',
      3: 'sections',
      4: 'contact',
      5: 'images',
    }
    const id = map[stepNumber]
    if (id) {
      if (!openIds.includes(id)) {
        setOpenIds([...openIds, id])
      }
      requestAnimationFrame(() => {
        document.getElementById(`step-${stepNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [openIds, setOpenIds])

  const resetAll = useCallback(() => {
    setDraft(createEmptyBrief())
    setTemplateId('')
    setFieldErrors({})
    setServerErrors({})
    setFormError(null)
    setSectionsTouched(false)
    clearBriefDraft()
    saveSelectedTemplate('')
  }, [])

  const toggleStyle = useCallback(
    (value: string) => {
      setDraft((current) => {
        const has = current.styles.includes(value)
        if (has) return { ...current, styles: current.styles.filter((s) => s !== value) }
        if (current.styles.length >= MAX_STYLES) return current
        return { ...current, styles: [...current.styles, value] }
      })
    },
    [],
  )

  const toggleSection = useCallback((id: string) => {
    setSectionsTouched(true)
    setDraft((current) => {
      const has = current.sections.includes(id)
      if (has) return { ...current, sections: current.sections.filter((s) => s !== id) }
      if (current.sections.length >= MAX_SECTIONS) return current
      // Urutan katalog: tampilkan sesuai urutan, bukan urutan diklik.
      const next = [...current.sections, id]
      return {
        ...current,
        sections: SECTION_CATALOG.filter((s) => next.includes(s.id)).map((s) => s.id),
      }
    })
  }, [])

  const resetSectionsToSuggestion = useCallback(() => {
    setSectionsTouched(false)
    setDraft((current) => ({ ...current, sections: defaultSectionsFor(current.businessCategory) }))
  }, [])

  const handleCategoryChange = useCallback((value: string) => {
    setDraft((current) => {
      const next: BriefDraft = {
        ...current,
        businessCategory: value as BriefDraft['businessCategory'],
      }
      // Saran jenis website hanya dipasang bila user belum memilih sendiri.
      if (!current.websiteType) next.websiteType = suggestWebsiteType(next.businessCategory)
      // Pilihan toggle manual TIDAK ditimpa (Aturan 3.5).
      if (!sectionsTouched) next.sections = defaultSectionsFor(next.businessCategory)
      return next
    })
  }, [sectionsTouched])

  const addCustomSection = () => {
    const value = sectionInput.trim()
    if (!value) return
    if (draft.sections.length >= MAX_SECTIONS) {
      setSectionError(`Maksimal ${MAX_SECTIONS} bagian.`)
      return
    }
    if (value.length > API_LIMITS.sectionName) {
      setSectionError(`Tiap bagian maksimal ${API_LIMITS.sectionName} karakter.`)
      return
    }
    if (draft.sections.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSectionError(`Bagian "${value}" sudah ada.`)
      setSectionInput('')
      return
    }
    setDraft((current) => ({ ...current, sections: [...current.sections, value] }))
    setSectionInput('')
    setSectionError(null)
  }

  const removeCustomSection = (value: string) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((s) => s !== value),
    }))
  }

  const focusFirstError = useCallback(
    (found: Partial<Record<BriefFieldName, string>>) => {
      const firstField = (Object.keys(found) as BriefFieldName[]).find((key) => found[key])
      const group = firstField ? FIELD_GROUP[firstField] : undefined
      if (group) setOpenIds([...openIds, group])
      if (firstField === 'description') {
        requestAnimationFrame(() => descriptionRef.current?.focus())
        return
      }
      if (!firstField) return
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-brief-field="${firstField}"]`)
        el?.focus()
      })
    },
    [openIds, setOpenIds],
  )

  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectRequest) => projectsApi.create(payload),
    onSuccess: (project) => {
      // Draf & gambar tidak perlu lagi setelah project tersimpan.
      clearBriefDraft()
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
        const mapped: Partial<Record<BriefFieldName, string>> = {}
        const remaining: Record<string, string> = {}
        for (const [key, message] of Object.entries(err.fields)) {
          const field = SERVER_FIELD_MAP[key]
          if (field) mapped[field] = `Server menolak: ${message}`
          else remaining[key] = message
        }
        setServerErrors(remaining)
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped)
          setFormError('Ada isian yang perlu diperbaiki.')
          focusFirstError(mapped)
        } else {
          setFormError('Periksa kembali isian formulir Anda.')
        }
      } else {
        setFormError(getErrorMessage(err))
      }
    },
  })

  const busy = createMutation.isPending

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setServerErrors({})

    const found = validateBrief(draft)
    setFieldErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Ada isian yang perlu diperbaiki.')
      focusFirstError(found)
      return
    }

    createMutation.mutate(buildProjectPayload(draft).payload)
  }

  const descLength = draft.description.trim().length
  const showDescWarning = descLength > 0 && descLength < 10
  const showDescHint = descLength >= 10 && descLength < 40

  // Kerapatan "nyaman" (bukan spacious penuh): jarak antarfield 24 (token
  // --space-field), label ke input 8 (--space-label), antarkelompok 32
  // (--space-group). Dipakai agar total tinggi form tidak naik >15%.
  const aboutContent = (
    <div className="space-y-field">
      <div className="space-y-label">
        <div className="flex items-baseline justify-between gap-stack-sm">
          <Label htmlFor="description">Deskripsi Website</Label>
          <span className="text-hint text-zinc-600 dark:text-muted-foreground">
            {descLength}/{MAX_USER_DESCRIPTION}
          </span>
        </div>
        <Textarea
          id="description"
          ref={descriptionRef}
          value={draft.description}
          rows={7}
          maxLength={MAX_USER_DESCRIPTION}
          disabled={busy}
          placeholder="cth. Kedai kopi lokal di Purwokerto. Kami menyangrai kopi sendiri, buka jam 08.00-22.00, dan menerima pesanan biji kopi untuk pelanggan yang menyeduh di rumah."
          onChange={(e) => {
            update('description', e.target.value)
            clearError('description')
          }}
          aria-required="true"
          aria-invalid={Boolean(mergedErrors.description)}
          aria-describedby={
            [
              'description-hint',
              showDescWarning || showDescHint ? 'description-warning' : null,
              mergedErrors.description ? 'description-error' : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
        <p id="description-hint" className="text-hint text-zinc-600 dark:text-muted-foreground">
          Jawab tiga pertanyaan ini: apa usahamu? siapa pelanggannya? apa yang ingin mereka lakukan
          di websitemu?
        </p>
        {(showDescWarning || showDescHint) && (
          <p id="description-warning" className="text-hint text-amber-800 dark:text-amber-300">
            {showDescWarning
              ? 'Terlalu pendek. AI akan sulit memahami usahamu. Minimal 10 karakter.'
              : 'Cukup, tapi lebih detail akan menghasilkan website yang lebih tepat.'}
          </p>
        )}
        {mergedErrors.description && (
          <p id="description-error" role="alert" className="text-hint text-destructive">
            {mergedErrors.description}
          </p>
        )}
      </div>

      <div className="space-y-label">
        <Label htmlFor="brandName">Nama usaha atau brand</Label>
        <Input
          id="brandName"
          className="min-h-control-min md:min-h-10"
          data-brief-field="brandName"
          value={draft.brandName}
          maxLength={120}
          disabled={busy}
          placeholder="cth. Kopi Senja"
          onChange={(e) => {
            update('brandName', e.target.value)
            clearError('brandName')
          }}
          aria-invalid={Boolean(mergedErrors.brandName)}
          aria-describedby={mergedErrors.brandName ? 'brandName-error' : undefined}
        />
        {mergedErrors.brandName && (
          <p id="brandName-error" role="alert" className="text-hint text-destructive">
            {mergedErrors.brandName}
          </p>
        )}
      </div>

      <div className="space-y-label">
        <Label id="label-kategori">Jenis usaha</Label>
        <RadioCards
          name="businessCategory"
          legendId="label-kategori"
          options={BUSINESS_CATEGORY_OPTIONS}
          value={draft.businessCategory}
          onChange={handleCategoryChange}
          disabled={busy}
        />
      </div>

      <div className="space-y-label">
        <Label id="label-tujuan">Tujuan utama website</Label>
        <RadioCards
          name="goal"
          legendId="label-tujuan"
          options={BRIEF_GOAL_OPTIONS}
          value={draft.goal}
          onChange={(v) => update('goal', v as BriefDraft['goal'])}
          disabled={busy}
        />
      </div>

      <div className="space-y-label">
        <Label htmlFor="audience">Siapa yang akan datang?</Label>
        <Input
          id="audience"
          className="min-h-control-min md:min-h-10"
          data-brief-field="audience"
          value={draft.audience}
          maxLength={200}
          disabled={busy}
          placeholder="cth. Mahasiswa dan pekerja yang butuh tempat tenang"
          onChange={(e) => update('audience', e.target.value)}
          aria-invalid={Boolean(mergedErrors.audience)}
          aria-describedby={mergedErrors.audience ? 'audience-error' : undefined}
        />
        {mergedErrors.audience && (
          <p id="audience-error" role="alert" className="text-hint text-destructive">
            {mergedErrors.audience}
          </p>
        )}
      </div>

      <details className="rounded-lg border border-border bg-muted/30 p-control">
        <summary className="ctl min-h-control-min cursor-pointer text-control font-medium text-foreground">
          Lanjutan: judul project, catatan tambahan, jenis halaman
        </summary>
        <div className="mt-control space-y-field">
          <div className="space-y-label">
            <Label htmlFor="title">Judul project (opsional)</Label>
            <Input
              id="title"
              className="min-h-control-min md:min-h-10"
              data-brief-field="title"
              value={draft.title}
              maxLength={API_LIMITS.title}
              disabled={busy}
              placeholder="cth. Website Kopi Senja"
              onChange={(e) => update('title', e.target.value)}
              aria-invalid={Boolean(mergedErrors.title)}
              aria-describedby={mergedErrors.title ? 'title-error' : undefined}
            />
            {mergedErrors.title && (
              <p id="title-error" role="alert" className="text-hint text-destructive">
                {mergedErrors.title}
              </p>
            )}
          </div>

          <div className="space-y-label">
            <Label htmlFor="extraNotes">Catatan tambahan (opsional)</Label>
            <Textarea
              id="extraNotes"
              data-brief-field="extraNotes"
              value={draft.extraNotes}
              rows={3}
              maxLength={1000}
              disabled={busy}
              placeholder="cth. Jangan pakai foto royalty-free, gunakan foto suasana kedai."
              onChange={(e) => update('extraNotes', e.target.value)}
              aria-invalid={Boolean(mergedErrors.extraNotes)}
              aria-describedby={mergedErrors.extraNotes ? 'extraNotes-error' : undefined}
            />
            {mergedErrors.extraNotes && (
              <p id="extraNotes-error" role="alert" className="text-hint text-destructive">
                {mergedErrors.extraNotes}
              </p>
            )}
          </div>

          <div className="space-y-label">
            <div className="flex items-baseline justify-between gap-stack-sm">
              <Label id="label-jenis-website">Jenis halaman</Label>
              <span className="text-hint text-zinc-600 dark:text-muted-foreground">
                {draft.websiteType ? '' : 'Biarkan kosong, AI memilih sendiri'}
              </span>
            </div>
            <RadioCards
              name="websiteType"
              legendId="label-jenis-website"
              options={WEBSITE_TYPE_OPTIONS}
              value={draft.websiteType}
              onChange={(v) => update('websiteType', v)}
              disabled={busy}
            />
          </div>
        </div>
      </details>
    </div>
  )

  const tampilContent = (
    <div className="space-y-group">
      <StyleLanguagePanel
        styles={draft.styles}
        options={STYLE_OPTIONS}
        onToggleStyle={toggleStyle}
        language={draft.language}
        onLanguageChange={(v) => update('language', v)}
        disabled={busy}
      />

      <Suspense
        fallback={<p className="text-hint text-zinc-600 dark:text-muted-foreground">Memuat pilihan warna…</p>}
      >
        <ColorPicker
          mode={draft.colorMode}
          onModeChange={(mode) => update('colorMode', mode)}
          primaryColor={draft.primaryColor}
          accentColor={draft.accentColor}
          onPrimaryChange={(v) => {
            update('primaryColor', v)
            update('palettePreset', '')
            clearError('primaryColor')
          }}
          onAccentChange={(v) => {
            update('accentColor', v)
            update('palettePreset', '')
            clearError('accentColor')
          }}
          palettePreset={draft.palettePreset}
          onPaletteChange={(id) => update('palettePreset', id)}
          errors={{ primaryColor: mergedErrors.primaryColor, accentColor: mergedErrors.accentColor }}
          disabled={busy}
        />
      </Suspense>
    </div>
  )

  const enabledCustom = draft.sections.filter(
    (id) => !SECTION_CATALOG.some((s) => s.id === id),
  )

  const onContactChange = (field: string, value: string) => {
    updateContact(field, value)
    clearError(field as BriefFieldName)
  }

  const sectionsContent = (
    <Suspense
      fallback={
        <p className="text-hint text-zinc-600 dark:text-muted-foreground">Memuat pilihan bagian…</p>
      }
    >
      <SectionsPanel
        category={draft.businessCategory}
        enabled={draft.sections}
        onResetToSuggestion={resetSectionsToSuggestion}
        onResetAll={resetAll}
        disabled={busy}
        catalogToggles={
          <div className="space-y-label">
            <div className="flex items-baseline justify-between gap-stack-sm">
              <Label id="label-bagian">Bagian halaman</Label>
              <span className="text-hint text-zinc-600 dark:text-muted-foreground">
                {draft.sections.length}/{MAX_SECTIONS} menyala
              </span>
            </div>
            <SectionToggles
              legendId="label-bagian"
              items={SECTION_CATALOG.map((item) => ({
                id: item.id,
                label: sectionLabel(item.id, draft.businessCategory),
                description: item.description,
              }))}
              enabled={draft.sections}
              onToggle={toggleSection}
              max={MAX_SECTIONS}
              disabled={busy}
            />
          </div>
        }
        sectionError={sectionError}
        sectionInput={sectionInput}
        onSectionInputChange={setSectionInput}
        onAddSection={addCustomSection}
        customSections={enabledCustom}
        onRemoveSection={removeCustomSection}
      />
    </Suspense>
  )

  const contactContent = (
    <Suspense
      fallback={
        <p className="text-hint text-zinc-600 dark:text-muted-foreground">Memuat isian kontak…</p>
      }
    >
      <ContactPanel
        contact={draft.contact}
        onChange={onContactChange}
        errors={mergedErrors}
        disabled={busy}
      />
    </Suspense>
  )

  const imagesContent = (
    <Suspense
      fallback={
        <p className="text-hint text-zinc-600 dark:text-muted-foreground">Memuat pemilih gambar…</p>
      }
    >
      <ImagesPanel images={images} onChange={setImages} disabled={busy} />
    </Suspense>
  )

  const accordionItems = [
    {
      id: 'about',
      title: '1. Tentang usahamu',
      hint: mergedErrors.description ? 'Ada isian yang perlu diperbaiki' : 'Wajib diisi: deskripsi usaha',
      content: aboutContent,
    },
    {
      id: 'tampilan',
      title: '2. Tampilan',
      hint: draft.styles.length > 0 ? `Gaya: ${draft.styles.join(', ')}` : 'Gaya, warna, dan bahasa',
      content: tampilContent,
    },
    {
      id: 'sections',
      title: '3. Isi halaman',
      hint: `${draft.sections.length}/${MAX_SECTIONS} bagian menyala`,
      content: sectionsContent,
    },
    {
      id: 'contact',
      title: '4. Kontak & tombol utama',
      hint: 'Semua opsional',
      content: contactContent,
    },
    { id: 'images', title: '5. Gambar referensi', hint: 'Opsional, maks 4', content: imagesContent },
  ]

function Topography() {
  return (
    <svg
      className="topography pointer-events-none absolute inset-0 h-full w-full opacity-30"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g>
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={`t${i}`}
            className={i % 5 === 0 ? "index-contour" : ""}
            d={`M${720 + i * 18} ${-35 + i * 17}C990 ${-10 + i * 22} 1050 ${125 + i * 17} 1190 ${95 + i * 19}S1370 ${15 + i * 20} 1510 ${85 + i * 17}`}
          />
        ))}
      </g>
      <g>
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={`b${i}`}
            className={i % 5 === 0 ? "index-contour" : ""}
            d={`M${-100 - i * 8} ${650 + i * 20}C80 ${580 + i * 22} 180 ${770 + i * 13} 340 ${700 + i * 18}S540 ${640 + i * 20} 680 ${750 + i * 16}`}
          />
        ))}
      </g>
    </svg>
  )
}

  return (
    <div className="new-project">
      <Topography />
      <header className="topbar">
        <Link to="/projects" className="back-button desktop-back">
          <span>&larr;</span> Kembali ke Project Saya
        </Link>
        <Link to="/projects" className="back-button mobile-back">
          <span>&larr;</span> Kembali
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="layout">
        <main>
          <div className="hero">
            <h1>Ceritakan usahamu, kami buatkan websitenya</h1>
            <p>
              Tidak perlu istilah teknis. Isi yang kamu tahu saja, kami atur bagian, warna, dan tombolnya.
            </p>
          </div>

          <section aria-labelledby="label-mulai-cepat">
            <div className="section-heading">
              <div>
                <h2 id="label-mulai-cepat">Mulai cepat</h2>
                <p>Pilih yang paling mirip, lalu ubah seperlunya.</p>
              </div>
            </div>
            <Suspense
              fallback={
                <p className="text-hint text-zinc-600 dark:text-muted-foreground">Memuat pilihan contoh…</p>
              }
            >
              <TemplatePicker selectedId={templateId} onSelect={selectTemplate} disabled={busy} />
            </Suspense>
            {templateId && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-hint text-zinc-600 dark:text-muted-foreground">
                  Template hanya mengisi form. Semua isian tetap bisa kamu ubah.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetAll}
                  title="Kosongkan isian formulir"
                  className="min-h-control-min shrink-0 self-start sm:self-auto"
                >
                  <RotateCcw className="size-3.5" />
                  Kosongkan formulir
                </Button>
              </div>
            )}
          </section>

          {preview.trimmed && (
            <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-hint text-amber-800 dark:text-amber-300 mt-4">
              Brief-mu sangat panjang. Saat dikirim, bagian dengan prioritas paling rendah dipangkas agar muat. Kalimat deskripsi utuh tetap dikirim.
            </p>
          )}

          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-control text-red-400 mt-4"
            >
              {formError}
              {Object.keys(serverErrors).length > 0 && (
                <ul className="mt-1 list-disc pl-4">
                  {Object.entries(serverErrors).map(([key, message]) => (
                    <li key={key}>
                      {key}: {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="accordions">
            <BriefAccordion items={accordionItems} openIds={openIds} onToggle={toggleAccordion} />
          </div>

          <p className="static-note mt-6">
            Website hasilnya berupa halaman statis: tombol WhatsApp, telepon, email, dan peta. Tidak ada formulir, login, atau pembayaran online.
          </p>
        </main>

        <aside className="summary-column">
          <div className="summary-card">
            <div className="summary-title">
              <h2>Brief kamu</h2>
              <strong>{completeness.percent}% lengkap</strong>
            </div>
            <div className="segments">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < Math.round(completeness.percent / 20) ? "filled" : ""} />
              ))}
            </div>
            <p className="next-step">
              {completeness.percent >= 20
                ? "Kamu bisa melengkapi bagian opsional atau langsung membuat website."
                : "Langkah berikutnya: Tulis deskripsi singkat: apa usahamu dan siapa pelangganmu."}
            </p>
            <div className="checklist">
              <button type="button" onClick={() => jump(1)}>
                <span className={completeness.percent >= 20 ? "status done" : "status"}>
                  {completeness.percent >= 20 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span>Tentang usahamu</span>
                <span className="badge">Wajib</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <button type="button" onClick={() => jump(2)}>
                <span className={draft.styles.length > 0 ? "status done" : "status"}>
                  {draft.styles.length > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span>Tampilan</span>
                <span className="badge">Opsional</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <button type="button" onClick={() => jump(3)}>
                <span className={draft.sections.length > 0 ? "status done" : "status"}>
                  {draft.sections.length > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span>Isi halaman</span>
                <span className="badge">Opsional</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <button type="button" onClick={() => jump(4)}>
                <span className={Object.values(draft.contact).some(Boolean) ? "status done" : "status"}>
                  {Object.values(draft.contact).some(Boolean) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span>Kontak & tombol</span>
                <span className="badge">Opsional</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <button type="button" onClick={() => jump(5)}>
                <span className={images.length > 0 ? "status done" : "status"}>
                  {images.length > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </span>
                <span>Gambar referensi</span>
                <span className="badge">Opsional</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="primary submit mt-4 w-full"
              isLoading={busy}
              disabled={busy}
            >
              Simpan & Buatkan Website
            </Button>
            <p className="static-note">
              Website hasilnya berupa halaman statis: tombol WhatsApp, telepon, email, dan peta. Tidak ada formulir, login, atau pembayaran online.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

/**
 * Peta field dari server (VALIDATION_ERROR) ke field brief.
 * Backend memakai nama JSON datar dan pesan dalam bahasa Inggris
 * (diverifikasi Fase 0: {"description":"must be at least 10 characters"}),
 * jadi PETA INI TIDAK LENGKAP — field yang tak punya pasangan ditampilkan
 * apa adanya di banner error, bukan dipaksa ke field lain.
 */
const SERVER_FIELD_MAP: Record<string, BriefFieldName> = {
  description: 'description',
  title: 'title',
  business_name: 'brandName',
  color_palette: 'accentColor',
}