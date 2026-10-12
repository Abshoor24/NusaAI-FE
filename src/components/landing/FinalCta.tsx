import { Link } from '@tanstack/react-router'
import { LandingIcon } from './LandingIcons'
import type { LandingCta } from './landing-data'

export function FinalCta({ cta }: { cta: LandingCta }) {
  return (
    <section className="landing-section" aria-labelledby="landing-mulai">
      <div className="landing-container">
        <div className="landing-cta reveal">
          <h2 id="landing-mulai">Ceritakan website pertamamu</h2>
          <p>Satu kalimat cukup untuk mulai. AI menyusun drafnya, kamu yang menentukan hasil akhir.</p>
          <div className="landing-cta-row">
            <Link to={cta.to} className="landing-btn landing-btn-primary">
              {cta.label}
              <LandingIcon name="arrow" className="size-4" />
            </Link>
            <Link to="/projects" className="landing-btn landing-btn-secondary">
              Buka Project Saya
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
