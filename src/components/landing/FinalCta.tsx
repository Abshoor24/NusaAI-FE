import { Link } from '@tanstack/react-router'
import { LandingIcon } from './LandingIcons'
import type { LandingCta } from './landing-data'

/**
 * Kartu CTA akhir sesuai referensi Figma: permukaan gelap dengan glow
 * ungu/biru, badge, headline, dan dua tombol pil.
 * Gelap permanen di kedua tema seperti hero (R-31).
 */
export function FinalCta({ cta }: { cta: LandingCta }) {
  return (
    <section className="cta-final" aria-labelledby="landing-mulai">
      <div className="landing-container">
        <div className="cta-final-card reveal">
          <p className="cta-final-badge">Mulai sekarang</p>
          <h2 id="landing-mulai">Siap membuat websitemu?</h2>
          <p className="cta-final-sub">Mulai dari satu kalimat. Selesai dalam hitungan menit.</p>
          <div className="cta-final-row">
            <Link to={cta.to} className="cta-final-primary">
              Buka Aplikasi
              <LandingIcon name="arrow" className="size-4" />
            </Link>
            <Link to="/projects" className="cta-final-secondary">
              Buka Project Saya
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
