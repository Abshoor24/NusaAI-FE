import { steps } from './landing-data'

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="landing-mini" aria-hidden="true">
        <div className="landing-ref-row">
          <span>Landing</span>
          <span>Blog</span>
        </div>
      </div>
    )
  }
  if (index === 1) {
    return (
      <div className="landing-mini" aria-hidden="true">
        <div className="landing-file-row">
          <span>index.html</span>
        </div>
      </div>
    )
  }
  if (index === 2) {
    return (
      <div className="landing-mini" aria-hidden="true">
        <div className="landing-bubble landing-bubble-user">Buat judulnya lebih singkat.</div>
        <div className="landing-bubble">Siap, sudah diperbarui.</div>
      </div>
    )
  }
  return (
    <div className="landing-mini" aria-hidden="true">
      <div className="landing-file-row">
        <span>
          index.html<small>Satu file, siap dibuka</small>
        </span>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section className="landing-section" id="cara-kerja" aria-labelledby="landing-cara-kerja">
      <div className="landing-container">
        <div className="landing-intro landing-intro-center reveal">
          <h2 id="landing-cara-kerja">Dari ide sampai file HTML</h2>
          <p>Isi brief, lihat pratinjaunya, revisi, lalu unduh.</p>
        </div>
        <ol className="landing-steps">
          {steps.map((step, index) => (
            <li key={step.title} className="landing-step reveal">
              <span className="landing-step-number" aria-hidden="true" />
              <h3>
                <span className="sr-only">{index + 1}. </span>
                {step.title}
              </h3>
              <p>{step.description}</p>
              <StepVisual index={index} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
