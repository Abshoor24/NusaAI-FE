import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LandingIcon } from './LandingIcons'
import { heroSuggestions } from './landing-data'
import type { LandingCta } from './landing-data'

function PromptForm({ cta }: { cta: LandingCta }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void navigate({ to: cta.to })
  }

  return (
    <div className="landing-prompt">
      <form className="landing-prompt-box" onSubmit={submit}>
        <label htmlFor="landing-prompt-input" className="sr-only">
          Ceritakan website yang ingin dibuat
        </label>
        <input
          id="landing-prompt-input"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Contoh: landing page untuk kedai kopi di Purwokerto"
          autoComplete="off"
        />
        <button type="submit" className="landing-prompt-submit">
          <span>Mulai</span>
          <LandingIcon name="arrow" className="size-4" />
        </button>
      </form>
      <div className="landing-suggestions" aria-label="Saran jenis website">
        {heroSuggestions.map((item) => (
          <button key={item} type="button" onClick={() => setValue(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function ProductMockup() {
  return (
    <div>
      <div className="landing-mockup" aria-hidden="true">
        <div className="landing-window-bar">
          <span>Contoh tampilan ruang kerja</span>
          <span className="landing-window-status">
            <LandingIcon name="check" className="size-3.5" />
            Contoh
          </span>
        </div>
        <div className="landing-app-shell">
          <div className="landing-chat">
            <div className="landing-chat-brand">
              <span className="landing-chat-brand-mark" />
              Pakhir Studio
            </div>
            <span className="landing-chat-label">Permintaan awal</span>
            <div className="landing-bubble">Buat landing page untuk kedai kopi lokal.</div>
            <div className="landing-bubble">Website sudah dibuat. Silakan cek pratinjaunya.</div>
            <div className="landing-bubble landing-bubble-user">
              Buat bagian menu lebih menonjol.
            </div>
            <div className="landing-revision-hint">Tulis revisi berikutnya di sini</div>
          </div>
          <div className="landing-preview">
            <div className="landing-preview-bar">
              <span>Pratinjau</span>
              <span>Desktop</span>
            </div>
            <div className="landing-preview-canvas">
              <div className="landing-thumb landing-thumb-paper landing-thumb-serifi">
                <small>Kopi lokal, Purwokerto</small>
                <h3>Tempat pulang dalam setiap seduhan.</h3>
                <div className="landing-thumb-pattern landing-thumb-pattern-lines" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="landing-mockcaption">
        Ilustrasi: tulis brief, revisi dengan kalimat biasa, lalu cek pratinjau.
      </p>
    </div>
  )
}

export function Hero({ cta }: { cta: LandingCta }) {
  return (
    <div className="landing-hero">
      <div className="landing-container">
        <div className="landing-hero-copy">
          <span className="landing-kicker">Pembuat website AI</span>
          <h1>
            Ceritakan websitenya.
            <br />
            AI yang membuatnya.
          </h1>
          <p className="landing-lead">
            Jelaskan website yang kamu inginkan dengan kalimat biasa. Pakhir Studio menulis satu
            file HTML siap pakai, kamu tinggal revisi dan unduh.
          </p>
          <PromptForm cta={cta} />
          <a href="#contoh" className="landing-project-link">
            Lihat contoh hasil
            <LandingIcon name="arrow" className="size-4" />
          </a>
        </div>
        <ProductMockup />
      </div>
    </div>
  )
}
