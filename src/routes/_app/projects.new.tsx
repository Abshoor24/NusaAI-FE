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
import { Container } from '@/components/ui/container'
import type { PickedImage } from '@/components/ImagePicker'
import { RadioCards } from '@/components/brief/radio-cards'
import { SectionToggles } from '@/components/brief/section-toggles'
import { BriefAccordion } from '@/components/brief/brief-accordion'
import { CompletenessMeter } from '@/components/brief/completeness-meter'
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
  useDocumentTitle('Buat Website Baru — Pakhir Studio')
  const navigate = useNavigate()
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const firstRender = useRef(true)

  const [draft, setDraft] = useState<BriefDraft>(() => loadBriefDraft() ?? createEmptyBrief())
  const [templateId, setTemplateId] = useState<string>(() => loadSelectedTemplate())
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

  const aboutContent = (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="description">Deskripsi Website</Label>
          <span className="text-xs text-zinc-600 dark:text-muted-foreground">
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
          placeholder="cth. Kedai kopi lokal di Purwokerto. Kami menyangrai kopi sendiri, buka jam 08.00-22.00, dan menerima pesanan beans untuk pelanggan yang menyeduh di rumah."
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
        <p id="description-hint" className="text-xs text-zinc-600 dark:text-muted-foreground">
          Jawab tiga pertanyaan ini: apa usahamu? siapa pelanggannya? apa yang ingin mereka lakukan
          di websitemu?
        </p>
        {(showDescWarning || showDescHint) && (
          <p id="description-warning" className="text-xs text-amber-800 dark:text-amber-300">
            {showDescWarning
              ? 'Terlalu pendek — AI akan sulit memahami usahamu. Minimal 10 karakter.'
              : 'Cukup, tapi lebih detail akan menghasilkan website yang lebih tepat.'}
          </p>
        )}
        {mergedErrors.description && (
          <p id="description-error" role="alert" className="text-xs text-destructive">
            {mergedErrors.description}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brandName">Nama usaha atau brand</Label>
        <Input
          id="brandName"
          className="min-h-11 md:min-h-10"
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
          <p id="brandName-error" role="alert" className="text-xs text-destructive">
            {mergedErrors.brandName}
          </p>
        )}
      </div>

      <div className="space-y-2">
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

      <div className="space-y-2">
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

      <div className="space-y-1.5">
        <Label htmlFor="audience">Siapa yang akan datang?</Label>
        <Input
          id="audience"
          className="min-h-11 md:min-h-10"
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
          <p id="audience-error" role="alert" className="text-xs text-destructive">
            {mergedErrors.audience}
          </p>
        )}
      </div>

      <details className="rounded-lg border border-border bg-muted/30 p-3">
        <summary className="min-h-[44px] cursor-pointer text-sm font-medium text-foreground">
          Lanjutan: judul project, catatan tambahan, jenis halaman
        </summary>
        <div className="mt-3 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Judul project (opsional)</Label>
            <Input
              id="title"
              className="min-h-11 md:min-h-10"
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
              <p id="title-error" role="alert" className="text-xs text-destructive">
                {mergedErrors.title}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
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
              <p id="extraNotes-error" role="alert" className="text-xs text-destructive">
                {mergedErrors.extraNotes}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label id="label-jenis-website">Jenis halaman</Label>
              <span className="text-xs text-zinc-600 dark:text-muted-foreground">
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
    <div className="space-y-6">
      <StyleLanguagePanel
        styles={draft.styles}
        options={STYLE_OPTIONS}
        onToggleStyle={toggleStyle}
        language={draft.language}
        onLanguageChange={(v) => update('language', v)}
        disabled={busy}
      />

      <Suspense
        fallback={<p className="text-xs text-zinc-600 dark:text-muted-foreground">Memuat pilihan warna…</p>}
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
        <p className="text-xs text-zinc-600 dark:text-muted-foreground">Memuat pilihan bagian…</p>
      }
    >
      <SectionsPanel
        category={draft.businessCategory}
        enabled={draft.sections}
        onResetToSuggestion={resetSectionsToSuggestion}
        onResetAll={resetAll}
        disabled={busy}
        catalogToggles={
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label id="label-bagian">Bagian halaman</Label>
              <span className="text-xs text-zinc-600 dark:text-muted-foreground">
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
        <p className="text-xs text-zinc-600 dark:text-muted-foreground">Memuat isian kontak…</p>
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
        <p className="text-xs text-zinc-600 dark:text-muted-foreground">Memuat pemilih gambar…</p>
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

  return (
    // Satu form untuk seluruh halaman: elemen scroll (bukan window) + bilah
    // aksi sticky. min-h-0 WAJIB agar flex-1 boleh menyusut di dalam <main>
    // (parent) yang overflow-clip — tanpa itu konten terpotong dan tak
    // bisa di-scroll (bug 0.4). `relative` sebagai pengaman containing block
    // agar input absolute (sr-only) digulir bersama form, bukan <main>.
    <form onSubmit={handleSubmit} className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <Container className="max-w-3xl py-8">
        <div className="mb-6">
          <Link
            to="/projects"
            className="inline-flex min-h-[44px] items-center text-xs text-muted-foreground hover:text-foreground"
          >
            &larr; Kembali ke Project Saya
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Ceritakan usahamu, kami buatkan websitenya
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tidak perlu istilah teknis. Isi yang kamu tahu saja — kami atur bagian, warna, dan
            tombolnya.
          </p>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="label-mulai-cepat" className="space-y-3">
            <div>
              <h2 id="label-mulai-cepat" className="text-base font-semibold tracking-tight">
                Mulai cepat
              </h2>
              <p className="text-sm text-muted-foreground">
                Pilih yang paling mirip, lalu ubah seperlunya.
              </p>
            </div>
            <Suspense
              fallback={
                <p className="text-xs text-zinc-600 dark:text-muted-foreground">Memuat pilihan contoh…</p>
              }
            >
              <TemplatePicker selectedId={templateId} onSelect={selectTemplate} disabled={busy} />
            </Suspense>
            {templateId && (
              <p className="text-xs text-zinc-600 dark:text-muted-foreground">
                Template hanya mengisi form. Semua isian tetap bisa kamu ubah.{' '}
                <button
                  type="button"
                  onClick={resetAll}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Mulai dari awal
                </button>
              </p>
            )}
          </section>

          <CompletenessMeter result={completeness} />

          {preview.trimmed && (
            <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              Brief-mu sangat panjang. Saat dikirim, bagian dengan prioritas paling rendah (catatan
              tambahan, target pengunjung, sebagian info kontak) dipangkas agar muat — kalimat
              deskripsi utuh tetap dikirim.
            </p>
          )}

          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
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

          <BriefAccordion items={accordionItems} openIds={openIds} onToggle={toggleAccordion} />

          <p className="text-xs text-zinc-600 dark:text-muted-foreground">
            Website hasilnya berupa halaman statis: tombol WhatsApp, telepon, email, dan peta. Tidak
            ada formulir, login, atau pembayaran online.
          </p>
        </div>
      </Container>

      {/* Aksi utama: menempel di bawah area scroll, tetap solid di atas konten. */}
      <div className="sticky bottom-0 z-20 border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-3xl">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={busy}
            disabled={busy}
          >
            Simpan & Buatkan Website
          </Button>
        </div>
      </div>
    </form>
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