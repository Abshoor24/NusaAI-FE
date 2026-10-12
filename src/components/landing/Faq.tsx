import { useState } from 'react'
import { LandingIcon } from './LandingIcons'
import { faqs } from './landing-data'

export function Faq() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="landing-section" id="faq" aria-labelledby="landing-faq">
      <div className="landing-container">
        <div className="landing-faq">
          <div className="landing-intro reveal" style={{ marginBottom: 0 }}>
            <h2 id="landing-faq">Pertanyaan yang sering ditanyakan</h2>
            <p>Masih ada yang ingin diketahui? Temukan jawabannya di sini.</p>
          </div>
          <div className="landing-faq-list reveal">
            {faqs.map((faq, index) => {
              const open = openIndex === index
              const buttonId = `landing-faq-button-${index}`
              const answerId = `landing-faq-answer-${index}`
              return (
                <div key={faq.question} className="landing-faq-item">
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={answerId}
                    onClick={() => setOpenIndex(open ? -1 : index)}
                  >
                    <span>{faq.question}</span>
                    <span className="landing-faq-icon" aria-hidden="true">
                      <LandingIcon name={open ? 'x' : 'plus'} className="size-4" />
                    </span>
                  </button>
                  <p id={answerId} role="region" aria-labelledby={buttonId} hidden={!open} className="landing-faq-answer">
                    {faq.answer}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
