import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react"
import { BrandLogo } from "@/components/BrandLogo"
import { useTheme } from "@/hooks/use-theme"
import "./landing.css"

type IconName = "arrow" | "send" | "menu" | "x" | "moon" | "sun" | "phone" | "tablet" | "desktop" | "download" | "sparkle" | "code" | "file" | "image" | "history" | "plus"

const icons: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  send: <><path d="m21 3-7 18-3-8-8-3Z" /><path d="M21 3 11 13" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  moon: <path d="M20 14a8 8 0 1 1-10-10 6 6 0 0 0 10 10Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
  phone: <rect x="7" y="2" width="10" height="20" rx="2" />,
  tablet: <rect x="5" y="2" width="14" height="20" rx="2" />,
  desktop: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 21h14" /></>,
  sparkle: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" /><path d="m19 16 .7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" /></>,
  code: <><path d="m8 9-4 3 4 3m8-6 4 3-4 3M14 5l-4 14" /></>,
  file: <><path d="M6 2h8l4 4v16H6Z" /><path d="M14 2v5h5" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
}

function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

function Logo({ onClick }: { onClick?: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <a className="lp-logo" href="#hero" onClick={onClick} aria-label="Nusa AI">
      <BrandLogo variant="full" tone="auto" height={28} />
    </a>
  )
}

function Button({ children, secondary, href = "/new-project", onClick }: { children: ReactNode; secondary?: boolean; href?: string; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void }) {
  return <a className={`lp-button ${secondary ? "secondary" : ""} max-lg:min-h-control-min!`} href={href} onClick={onClick}>{children}</a>
}

function Heading({ label, title, copy, center }: { label: string; title: string; copy?: string; center?: boolean }) {
  return <div className={`lp-heading lp-reveal ${center ? "center" : ""}`}><span className="lp-label">{label}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()

  const scrollToSection = (e: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setOpen(false)
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const scrollToTop = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const themeLabel = resolvedTheme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'

  return <header className="lp-nav"><div className="lp-nav-inner">
    <Logo onClick={scrollToTop} />
    <nav className={open ? "open" : ""}>
      <a href="#fitur" onClick={(e) => scrollToSection(e, "fitur")}>Fitur</a>
      <a href="#cara-kerja" onClick={(e) => scrollToSection(e, "cara-kerja")}>Cara Kerja</a>
      <a href="#contoh" onClick={(e) => scrollToSection(e, "contoh")}>Contoh Hasil</a>
      <a href="#faq" onClick={(e) => scrollToSection(e, "faq")}>FAQ</a>
      <Button onClick={() => setOpen(false)}>Buka Aplikasi</Button>
    </nav>
    <div className="lp-nav-actions">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={themeLabel}
        aria-pressed={resolvedTheme === 'dark'}
        title={themeLabel}
      >
        <Icon name={resolvedTheme === 'dark' ? "sun" : "moon"} />
      </button>
      <Button>Buka Aplikasi</Button>
      <button className="lp-menu max-lg:min-h-control-min max-lg:min-w-control-min max-lg:place-content-center" onClick={() => setOpen(!open)} aria-label={open ? "Tutup menu" : "Buka menu"}>
        <Icon name={open ? "x" : "menu"} />
      </button>
    </div>
  </div></header>
}

const promptExamples = ["Landing page untuk kedai kopi di Purwokerto, gaya hangat dan modern...", "Portofolio fotografer dengan tampilan editorial dan elegan...", "Company profile studio arsitektur yang minimal dan berani..."]

function Prompt() {
  const [index, setIndex] = useState(0)
  useEffect(() => { const id = setInterval(() => setIndex(value => (value + 1) % promptExamples.length), 3200); return () => clearInterval(id) }, [])
  return <div className="lp-prompt-area">
    <div className="lp-prompt"><Icon name="sparkle" /><span><em>Contoh:</em> {promptExamples[index]}</span><a href="/new-project" aria-label="Mulai membuat website"><Icon name="send" /></a></div>
    <div className="lp-chips">{["Landing page", "Portofolio", "Company profile", "Toko online"].map(item => <span key={item}>{item}</span>)}</div>
    <a className="lp-project-link" href="/new-project">Buka Project Saya <Icon name="arrow" size={15} /></a>
  </div>
}

function DeviceSwitch() {
  return <div className="lp-device-switch"><button><Icon name="phone" size={14} /></button><button><Icon name="tablet" size={14} /></button><button className="active"><Icon name="desktop" size={14} /></button></div>
}

function ProductMockup() {
  return <div className="lp-product lp-reveal">
    <div className="lp-window-bar"><span><i /><i /><i /></span><small>studio.nusa-ai.example/proyek/kopi-senja</small><b>Tersimpan</b></div>
    <div className="lp-app">
      <aside><strong><i /> Nusa AI <small>v2</small></strong><label>PERMINTAAN AWAL</label><p>Buat landing page untuk kedai kopi lokal yang terasa hangat dan modern.</p><div className="lp-ai"><Icon name="sparkle" size={14} /> Website sudah dibuat. Lihat hasilnya di pratinjau.</div><div className="lp-user">Buat bagian menu lebih menonjol.</div><div className="lp-revision">Tulis revisi berikutnya... <i><Icon name="arrow" size={13} /></i></div></aside>
      <section><header><span>Pratinjau langsung</span><DeviceSwitch /><button><Icon name="download" size={14} /> Unduh</button></header><div className="lp-canvas"><div className="lp-coffee"><nav><b>Ruang Seduh</b><span>Menu&nbsp;&nbsp; Cerita&nbsp;&nbsp; Kunjungi</span><i>Pesan meja</i></nav><main><small>KOPI LOKAL • PURWOKERTO</small><h3>Tempat pulang,<br />dalam setiap seduhan.</h3><p>Kopi pilihan, ruang tenang, dan cerita yang tumbuh dari meja ke meja.</p><button>Lihat menu <Icon name="arrow" size={11} /></button></main><footer><i /><i /><i /></footer></div></div></section>
    </div>
  </div>
}

function Hero() {
  return <main className="lp-hero" id="hero"><div className="lp-grid" /><div className="lp-glow" /><div className="lp-hero-copy"><h1>Ceritakan websitenya.<br /><span>AI yang membuatnya.</span></h1><p>Jelaskan website yang kamu inginkan dengan kalimat biasa. Nusa AI menulis satu file HTML siap pakai, kamu tinggal revisi dan unduh.</p><Prompt /></div><ProductMockup /></main>
}

const steps = [
  ["Isi brief", "Ceritakan jenis website, gaya, dan warna yang kamu mau.", <div className="lp-mini-form"><label>Jenis website <b>Landing page</b></label><label>Gaya <b>Modern & hangat</b></label><label>Warna <span><i /><i /><i /></span></label></div>],
  ["AI menulis websitenya", "AI menyusun kode dan menampilkan prosesnya langsung.", <div className="lp-mini-code"><span>&lt;section class="hero"&gt;</span><span>&nbsp;&nbsp;&lt;h1&gt;Cerita dalam</span><span>&nbsp;&nbsp;setiap seduhan&lt;/h1&gt;</span><span>&lt;/section&gt;<i /></span></div>],
  ["Lihat dan revisi", "Tulis perubahan dengan kalimat biasa, tanpa menyentuh kode.", <div className="lp-mini-revise"><b>Ganti warna jadi biru</b><div><i /><i /><i /></div></div>],
  ["Unduh file HTML", "Satu file siap dibuka, dibagikan, atau dipublikasikan.", <div className="lp-mini-file"><Icon name="file" size={27} /><span><b>index.html</b><small>24 KB • Siap diunduh</small></span><Icon name="download" /></div>],
] as const

function Steps() {
  return <section className="lp-section" id="cara-kerja"><div className="lp-container"><Heading label="Cara Kerja" title="Dari ide sampai file HTML" copy="Isi brief, lihat pratinjaunya, revisi, lalu unduh." center /><div className="lp-steps">{steps.map((step, i) => <article className="lp-reveal" key={step[0]}><div className="lp-step-number"><span>{i + 1}</span></div><div className="lp-step-visual">{step[2]}</div><h3>{step[0]}</h3><p>{step[1]}</p></article>)}</div></div></section>
}

type CardProps = { icon: IconName; title: string; copy: string; className?: string; children: ReactNode }
function FeatureCard({ icon, title, copy, className = "", children }: CardProps) {
  const ref = useRef<HTMLElement>(null)
  return <article ref={ref} className={`lp-feature lp-reveal ${className}`} onMouseMove={e => { const r = ref.current?.getBoundingClientRect(); if (r) { ref.current?.style.setProperty("--mx", `${e.clientX - r.left}px`); ref.current?.style.setProperty("--my", `${e.clientY - r.top}px`) } }}><span className="lp-feature-icon"><Icon name={icon} /></span><h3>{title}</h3><p>{copy}</p>{children}</article>
}

function Features() {
  return <section className="lp-section lp-alt" id="fitur"><div className="lp-container"><Heading label="Fitur" title="Semua yang kamu butuhkan untuk membuat website" copy="Dari ide pertama hingga file siap pakai, semuanya dalam satu ruang kerja." /><div className="lp-bento">
    <FeatureCard icon="desktop" title="Pratinjau langsung" copy="Lihat setiap perubahan secara instan di berbagai ukuran layar." className="wide"><div className="lp-preview-demo"><DeviceSwitch /><div><header /><main><aside /><section><i /><b /><span /><button /></section></main></div></div></FeatureCard>
    <FeatureCard icon="sparkle" title="Revisi dengan kalimat biasa" copy="Tidak perlu tahu kode. Cukup katakan apa yang ingin diubah."><div className="lp-bubbles"><span>Judulnya dibuat lebih singkat</span><span>Siap, sudah diperbarui.</span></div></FeatureCard>
    <FeatureCard icon="history" title="Riwayat versi" copy="Revisi tidak pernah menghapus versi lama."><div className="lp-versions"><span><i />v3 <b>Terbaru</b></span><span><i />v2</span><span><i />v1</span></div></FeatureCard>
    <FeatureCard icon="image" title="Gambar referensi" copy="Lampirkan logo atau contoh desain untuk mengarahkan hasil."><div className="lp-thumbs"><span>Aa</span><span /><span><Icon name="plus" /></span></div></FeatureCard>
    <FeatureCard icon="code" title="Satu file HTML" copy="Langsung dibuka di browser, mudah dipindahkan."><div className="lp-html"><Icon name="file" /><span><b>index.html</b><small>Mandiri • Siap pakai</small></span></div></FeatureCard>
    <FeatureCard icon="phone" title="Responsif otomatis" copy="Hasil tetap rapi di HP, tablet, dan desktop."><div className="lp-screens"><span><i /><b /><b /></span><span><i /><b /></span></div></FeatureCard>
  </div></div></section>
}

const examples = [["Landing page", "Kedai kopi lokal", "kopi"], ["Portofolio", "Fotografer editorial", "foto"], ["Toko online", "Produk perawatan", "toko"], ["Company profile", "Studio arsitektur", "arsitek"], ["Blog", "Catatan perjalanan", "blog"]]
function Showcase() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (el) {
      const padLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0
      const atStart = el.scrollLeft <= padLeft + 5
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10
      setCanScrollLeft(!atStart)
      setCanScrollRight(!atEnd)
    }
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [])

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(".lp-example")
    const step = card ? card.offsetWidth + 20 : 450
    el.scrollBy({ left: direction * step, behavior: "smooth" })
  }

  return <section className="lp-section lp-showcase" id="contoh">
    <div className="lp-container"><Heading label="Contoh Hasil" title="Website yang bisa kamu buat" copy="Satu kalimat bisa menjadi banyak kemungkinan. Geser untuk melihat contoh lainnya." /></div>
    <div className="lp-carousel-wrapper">
      <div className={`lp-carousel-fade lp-fade-left ${canScrollLeft ? "active" : ""}`} aria-hidden="true" />
      <div className={`lp-carousel-fade lp-fade-right ${canScrollRight ? "active" : ""}`} aria-hidden="true" />
      <button
        type="button"
        className="lp-carousel-btn lp-carousel-prev"
        onClick={() => scrollByCard(-1)}
        disabled={!canScrollLeft}
        aria-label="Contoh sebelumnya"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        className="lp-carousel-btn lp-carousel-next"
        onClick={() => scrollByCard(1)}
        disabled={!canScrollRight}
        aria-label="Contoh berikutnya"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
      <div className="lp-example-scroll" ref={scrollRef}>
        {examples.map(([type, title, theme]) => <article className="lp-example lp-reveal" key={title}><div className="lp-browser"><header><i /><i /><i /><small>nusa-ai.example</small></header><div className={`lp-site ${theme}`}><nav><b>{theme === "kopi" ? "Ruang Seduh" : theme === "foto" ? "Nara Visual" : theme === "toko" ? "Lumi" : theme === "arsitek" ? "Ruang." : "Arah Pulang"}</b><span>Tentang&nbsp;&nbsp; Karya&nbsp;&nbsp; Kontak</span></nav><main><small>DIRANCANG DENGAN CERITA</small><h3>{theme === "kopi" ? "Kopi yang membuatmu pulang." : theme === "foto" ? "Mengabadikan yang tak terucap." : theme === "toko" ? "Rawat diri, secara alami." : theme === "arsitek" ? "Ruang yang hidup bersama waktu." : "Cerita dari jalan yang panjang."}</h3><button>Jelajahi</button></main><footer><i /><i /><i /></footer></div></div><span>{type}</span><h3>{title}</h3></article>)}
      </div>
    </div>
  </section>
}

const faqs = [
  ["Apakah hasilnya bisa dipakai langsung?", "Ya. Kamu mendapatkan satu file HTML mandiri yang bisa langsung dibuka di browser atau diunggah ke hosting."],
  ["Apakah saya bisa merevisi berkali-kali?", "Bisa. Tulis perubahan yang diinginkan dengan kalimat biasa dan Nusa AI akan membuat versi baru."],
  ["Apakah versi lama akan hilang?", "Tidak. Setiap revisi disimpan sebagai versi terpisah sehingga kamu selalu bisa kembali."],
  ["Bisa memakai gambar referensi?", "Bisa. Lampirkan logo, foto, atau contoh desain untuk membantu AI memahami arah visualmu."],
  ["Apakah tampil baik di HP?", "Ya. Setiap website dibuat responsif dan dapat diperiksa dalam mode HP, tablet, dan desktop."],
]

function FAQ() {
  const [open, setOpen] = useState(0)
  return <section className="lp-section" id="faq"><div className="lp-container lp-faq-layout"><Heading label="FAQ" title="Pertanyaan yang sering ditanyakan" copy="Temukan jawaban singkat sebelum kamu mulai." /><div className="lp-faq-list lp-reveal">{faqs.map(([q, a], i) => <div className={open === i ? "open" : ""} key={q}><button onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><Icon name={open === i ? "x" : "plus"} /></button><section><p>{a}</p></section></div>)}</div></div></section>
}

function Revision() {
  return <section className="lp-section lp-revision-section" id="revisi"><div className="lp-container"><div className="lp-revision-band lp-reveal"><div><span className="lp-label">Revisi Tanpa Batas</span><h2>Ubah apa saja, cukup dengan satu kalimat.</h2><p>Setiap revisi tersimpan sebagai versi baru. Kembali kapan saja.</p><div className="lp-revision-prompt">Buat tombol lebih besar dan ganti warna jadi hijau <i><Icon name="send" size={15} /></i></div></div><div className="lp-green-preview"><span>v2 • Terbaru</span><div><nav><b>Rimbun</b><small>Produk&nbsp;&nbsp; Cerita</small></nav><main><small>HIDUP LEBIH HIJAU</small><h3>Tanaman untuk ruang yang bernyawa.</h3><button>Temukan tanaman</button></main><i /><i /></div></div></div></div></section>
}

function CTA() {
  return <section className="lp-section lp-cta-section" id="mulai"><div className="lp-container"><div className="lp-cta lp-reveal"><div className="lp-grid" /><span className="lp-label">Mulai Sekarang</span><h2>Siap membuat websitemu?</h2><p>Mulai dari satu kalimat. Selesai dalam hitungan menit.</p><div><Button>Buka Aplikasi <Icon name="arrow" size={16} /></Button><Button secondary>Buka Project Saya</Button></div></div></div></section>
}

function Footer() {
  const scrollToTop = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return <footer className="lp-footer"><div className="lp-container"><div className="lp-footer-grid"><div><Logo onClick={scrollToTop} /><p>Nusa AI: jelaskan website yang diinginkan, lalu AI membuatnya.</p></div><div><b>Navigasi</b><a href="#hero" onClick={scrollToTop} className="max-md:inline-flex max-md:items-center max-md:min-h-control-min">Beranda</a><a href="/new-project" className="max-md:inline-flex max-md:items-center max-md:min-h-control-min">Project</a></div><div><b>Kontak</b><a href="mailto:muhammadnurulabshoor24@gmail.com" className="max-md:inline-flex max-md:items-center max-md:min-h-control-min">muhammadnurulabshoor24@gmail.com</a><p>Purwokerto, Indonesia</p></div></div><div className="lp-copyright">© 2026 Nusa AI. Semua hak dilindungi.</div></div></footer>
}

const marqueeItems = [
  "Landing page",
  "Portofolio",
  "Company profile",
  "Toko online sederhana",
  "Blog",
  "Landing page",
  "Portofolio",
]

function MarqueeGroup({ isAriaHidden = false }: { isAriaHidden?: boolean }) {
  return (
    <div className="lp-marquee-group" aria-hidden={isAriaHidden}>
      {[0, 1, 2, 3].map((rep) => (
        <span className="lp-marquee-seq" key={rep}>
          <b>Cocok untuk membuat</b>
          {marqueeItems.map((item, i) => (
            <span key={`${item}-${rep}-${i}`}>{item}</span>
          ))}
        </span>
      ))}
    </div>
  )
}

function Marquee() {
  return (
    <div className="lp-marquee">
      <div className="lp-marquee-track">
        <MarqueeGroup isAriaHidden={false} />
        <MarqueeGroup isAriaHidden={true} />
      </div>
    </div>
  )
}

export default function LandingPage() {
  useEffect(() => { const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add("visible")), { threshold: .1 }); document.querySelectorAll(".lp-reveal").forEach(node => observer.observe(node)); return () => observer.disconnect() }, [])
  return <div className="lp-page"><Navbar /><Hero /><Marquee /><Steps /><Features /><Showcase /><Revision /><FAQ /><CTA /><Footer /></div>
}
