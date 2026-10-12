import { useRef } from 'react'
import { LandingIcon } from './LandingIcons'
import { showcaseItems } from './landing-data'
import { cn } from '@/lib/utils/cn'

const patternClass = {
  lines: 'landing-thumb-pattern-lines',
  grid: 'landing-thumb-pattern-grid',
  dots: 'landing-thumb-pattern-dots',
  bars: 'landing-thumb-pattern-bars',
  frame: 'landing-thumb-pattern-frame',
} as const

export function Showcase() {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollByCards = (direction: 1 | -1) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="landing-section" id="contoh" aria-labelledby="landing-contoh">
      <div className="landing-container">
        <div className="landing-showcase-head reveal">
          <div className="landing-intro" style={{ marginBottom: 0 }}>
            <h2 id="landing-contoh">Satu kalimat bisa jadi banyak website</h2>
            <p>Geser untuk melihat contoh jenis website yang bisa dibuat.</p>
          </div>
          <div className="landing-showcase-nav">
            <button type="button" onClick={() => scrollByCards(-1)} aria-label="Lihat contoh sebelumnya">
              <span style={{ transform: 'scaleX(-1)', display: 'inline-flex' }}>
                <LandingIcon name="arrow" className="size-4" />
              </span>
            </button>
            <button type="button" onClick={() => scrollByCards(1)} aria-label="Lihat contoh berikutnya">
              <LandingIcon name="arrow" className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="landing-container">
        <div
          ref={scrollerRef}
          className="landing-scroller reveal"
          role="region"
          aria-label="Contoh jenis website"
          tabIndex={0}
        >
          {showcaseItems.map((item) => (
            <article key={item.title} className="landing-card">
              <div
                className={cn(
                  'landing-thumb',
                  `landing-thumb-${item.tone}`,
                  item.serif && 'landing-thumb-serifi',
                )}
                aria-hidden="true"
              >
                <small>{item.kicker}</small>
                <h3>{item.heading}</h3>
                <div className={cn('landing-thumb-pattern', patternClass[item.pattern])} />
              </div>
              <div className="landing-card-meta">
                <span>{item.category}</span>
                <h3>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
