import { useState } from 'react'
import type { FormEvent, SVGProps } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { SendIcon } from '@/components/ui/icons'
import { LandingIcon } from './LandingIcons'
import { StudioMockup } from './StudioMockup'
import { VelocityStrip } from './VelocityStrip'
import { heroPlaceholderTexts, heroQuickPills } from './landing-data'
import type { LandingCta } from './landing-data'
import { useRotatingPlaceholder } from './use-rotating-placeholder'

// Bintang empat sudut seperti ikon di dalam kolom input pada referensi Figma.
// Inline SVG kecil supaya tidak menambah dependensi ikon baru.
function SparkleMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="size-5 flex-none text-zinc-400"
      {...props}
    >
      <path d="M12 2c.6 4.9 2.7 7 7.6 7.6-4.9.6-7 2.7-7.6 7.6-.6-4.9-2.7-7-7.6-7.6C9.3 9 11.4 6.9 12 2Z" />
      <path d="M19 14c.3 2.3 1.3 3.3 3.6 3.6-2.3.3-3.3 1.3-3.6 3.6-.3-2.3-1.3-3.3-3.6-3.6 2.3-.3 3.3-1.3 3.6-3.6Z" />
    </svg>
  )
}

function PromptForm({ cta }: { cta: LandingCta }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  // Setara TextType React Bits: placeholder berganti dengan efek mengetik.
  // Berhenti saat input fokus agar tidak mengganggu yang sedang mengetik.
  const placeholder = useRotatingPlaceholder(heroPlaceholderTexts, { paused: focused })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    // Fungsi project dipertahankan: kirim membawa ke aplikasi/login.
    void navigate({ to: cta.to })
  }

  return (
    <div>
      <form className="landing-figma-prompt" onSubmit={submit}>
        <div className="landing-figma-prompt-inner">
          <SparkleMark />
          <label htmlFor="landing-prompt-input" className="sr-only">
            Ceritakan website yang ingin dibuat
          </label>
          <input
            id="landing-prompt-input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <button type="submit" className="landing-figma-send" aria-label="Kirim">
            <SendIcon className="size-5" />
          </button>
        </div>
      </form>
      <div className="landing-figma-pills" aria-label="Saran jenis website">
        {heroQuickPills.map((item) => (
          <button key={item.label} type="button" onClick={() => setValue(item.prompt)}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Hero({ cta }: { cta: LandingCta }) {
  return (
    <div className="landing-hero landing-hero-figma">
      <div className="landing-container">
        <div className="landing-hero-copy">
          <p className="landing-figma-badge">
            <i aria-hidden="true" />
            Satu file HTML mandiri, siap pakai
          </p>
          <h1>
            Ceritakan websitenya.
            <br />
            <span className="landing-figma-accent">AI</span> yang membuatnya.
          </h1>
          <p className="landing-lead">
            Jelaskan website yang kamu inginkan dengan kalimat biasa. Pakhir Studio menulis satu
            file HTML siap pakai, kamu tinggal revisi dan unduh.
          </p>
          <PromptForm cta={cta} />
        </div>

        <Link to={cta.to} className="landing-studio-link ">
          Buka Project Saya
          <LandingIcon name="arrow" className="size-4" />
        </Link>
        <StudioMockup />
      </div>

      <VelocityStrip />
    </div>
  )
}
