import { LandingIcon } from './LandingIcons'
import { features } from './landing-data'
import type { Feature } from './landing-data'
import { cn } from '@/lib/utils/cn'

const cardClass: Record<Feature['variant'], string> = {
  preview: 'landing-feature-wide',
  revise: 'landing-feature-half',
  version: 'landing-feature-half',
  reference: 'landing-feature-third',
  file: 'landing-feature-third',
  responsive: 'landing-feature-third',
}

function FeatureDemo({ variant }: { variant: Feature['variant'] }) {
  switch (variant) {
    case 'preview':
      return (
        <div className="landing-feature-demo" aria-hidden="true">
          <div className="landing-demo-browser">
            <div className="landing-demo-bar">
              <i />
              <i />
              <i />
            </div>
            <div className="landing-demo-body">
              <div className="landing-demo-side" />
              <div className="landing-demo-main" />
            </div>
          </div>
        </div>
      )
    case 'revise':
      return (
        <div className="landing-feature-demo" aria-hidden="true">
          <div className="landing-bubble landing-bubble-user">Judulnya dibuat lebih singkat.</div>
          <div className="landing-bubble">Siap, versi baru sudah tersedia.</div>
        </div>
      )
    case 'version':
      return (
        <div className="landing-feature-demo" aria-hidden="true">
          <ul className="landing-version-list">
            <li>
              Revisi ketiga<small>Versi terbaru</small>
            </li>
            <li>Revisi kedua</li>
            <li>Brief awal</li>
          </ul>
        </div>
      )
    case 'reference':
      return (
        <div className="landing-feature-demo" aria-hidden="true">
          <div className="landing-ref-row">
            <span>Aa</span>
            <span>
              <LandingIcon name="image" className="size-5" />
            </span>
          </div>
        </div>
      )
    case 'file':
      return (
        <div className="landing-feature-demo" aria-hidden="true">
          <div className="landing-file-row">
            <LandingIcon name="file" className="size-5" />
            <span>
              index.html<small>Satu file, siap dibuka</small>
            </span>
            <LandingIcon name="check" className="size-4" />
          </div>
        </div>
      )
    case 'responsive':
      return (
        <div className="landing-feature-demo" aria-hidden="true">
          <div className="landing-screens">
            <div className="landing-screen" />
            <div className="landing-screen landing-screen-phone" />
          </div>
        </div>
      )
  }
}

export function Features() {
  return (
    <section className="landing-section" id="fitur" aria-labelledby="landing-fitur">
      <div className="landing-container">
        <div className="landing-intro reveal">
          <h2 id="landing-fitur">Satu ruang kerja dari ide sampai file jadi</h2>
          <p>Ceritakan maumu, lihat hasilnya, revisi dengan kalimat biasa.</p>
        </div>
        <div className="landing-bento">
          {features.map((feature) => (
            <article key={feature.title} className={cn('landing-feature reveal', cardClass[feature.variant])}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <FeatureDemo variant={feature.variant} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
