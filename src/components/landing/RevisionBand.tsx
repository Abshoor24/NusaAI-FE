import { Link } from '@tanstack/react-router'
import type { LandingCta } from './landing-data'

export function RevisionBand({ cta }: { cta: LandingCta }) {
  return (
    <section className="landing-section" aria-labelledby="landing-revisi">
      <div className="landing-container">
        <div className="landing-revision reveal">
          <div>
            <span className="landing-kicker">Revisi</span>
            <h2 id="landing-revisi">Ubah apa saja dengan satu kalimat</h2>
            <p>
              Tulis perubahan yang kamu mau dengan bahasa sehari-hari. Setiap revisi tersimpan
              sebagai versi baru, jadi hasil sebelumnya tidak tertimpa.
            </p>
            <div className="landing-cta-row" style={{ justifyContent: 'flex-start' }}>
              <Link to={cta.to} className="landing-btn landing-btn-primary">
                {cta.label}
              </Link>
            </div>
          </div>
          <div aria-hidden="true">
            <div className="landing-thumb landing-thumb-mist">
              <small>Contoh revisi</small>
              <h3>Buat tombol lebih besar dan judulnya lebih singkat.</h3>
              <div className="landing-thumb-pattern landing-thumb-pattern-bars" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
