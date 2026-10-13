import { Download } from 'lucide-react'
import { LandingIcon } from './LandingIcons'
import { steps } from './landing-data'

/**
 * Section cara kerja sesuai referensi Figma: badge, headline, timeline
 * bernomor dengan garis penghubung, dan kartu visual mini per langkah.
 * Visual mini statis dan `aria-hidden` (ilustrasi, bukan kontrol).
 */
function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div>
        <p className="how-field-label">Jenis website</p>
        <p className="how-field">Landing page</p>
        <p className="how-field-label">Gaya</p>
        <p className="how-field">Modern &amp; hangat</p>
        <p className="how-field-label">Warna</p>
        <div className="how-dots">
          <i className="how-dot-a" />
          <i className="how-dot-b" />
          <i className="how-dot-c" />
        </div>
      </div>
    )
  }
  if (index === 1) {
    return (
      <pre className="how-code">
        <code>
          <span className="tk-p">&lt;</span>
          <span className="tk-t">section</span> <span className="tk-a">class</span>
          <span className="tk-p">=</span>
          <span className="tk-s">&quot;hero&quot;</span>
          <span className="tk-p">&gt;</span>
          {'\n  '}
          <span className="tk-p">&lt;</span>
          <span className="tk-t">h1</span>
          <span className="tk-p">&gt;</span>
          Cerita dalam
          {'\n  '}
          setiap seduhan
          <span className="tk-p">&lt;/</span>
          <span className="tk-t">h1</span>
          <span className="tk-p">&gt;</span>
          {'\n'}
          <span className="tk-p">&lt;/</span>
          <span className="tk-t">section</span>
          <span className="tk-p">&gt;</span>
          <span className="how-caret" />
        </code>
      </pre>
    )
  }
  if (index === 2) {
    return (
      <div>
        <p className="how-chat">Ganti warna jadi biru</p>
        <div className="how-mini-site">
          <span className="how-mini-bar" />
          <span className="how-mini-line" />
          <span className="how-mini-line how-mini-short" />
        </div>
      </div>
    )
  }
  return (
    <div className="how-file">
      <span className="how-file-icon">
        <LandingIcon name="file" className="size-5" />
      </span>
      <span className="how-file-meta">
        index.html<small>24 KB • Siap diunduh</small>
      </span>
      <span className="how-file-dl">
        <Download className="size-4" />
      </span>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section className="how" id="cara-kerja" aria-labelledby="landing-cara-kerja">
      <div className="landing-container">
        <div className="how-intro reveal">
          <p className="how-badge">Cara kerja</p>
          <h2 id="landing-cara-kerja">Dari ide sampai file HTML</h2>
          <p>Isi brief, lihat pratinjaunya, revisi, lalu unduh.</p>
        </div>
        <ol className="how-grid">
          {steps.map((step, index) => (
            <li key={step.title} className="how-col reveal">
              <span className="how-node" aria-hidden="true">
                {index + 1}
              </span>
              <div className="how-card" aria-hidden="true">
                <StepVisual index={index} />
              </div>
              <h3>
                <span className="sr-only">{index + 1}. </span>
                {step.title}
              </h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
