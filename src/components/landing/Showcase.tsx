import { useRef } from 'react'
import { LandingIcon } from './LandingIcons'
import { showcaseItems } from './landing-data'
import { cn } from '@/lib/utils/cn'

const patternClass = {
  lines: 'show-pattern-lines',
  grid: 'show-pattern-grid',
  dots: 'show-pattern-dots',
  bars: 'show-pattern-bars',
  frame: 'show-pattern-frame',
} as const

const toneClass = {
  paper: 'show-tone-paper',
  ink: 'show-tone-ink',
  mist: 'show-tone-mist',
  sand: 'show-tone-sand',
  clay: 'show-tone-clay',
} as const

export function Showcase() {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollByCards = (direction: 1 | -1) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="show" id="contoh" aria-labelledby="landing-contoh">
      <div className="landing-container">
        <div className="show-head reveal">
          <div>
            <h2 id="landing-contoh">Satu kalimat bisa jadi banyak website</h2>
            <p>Geser untuk melihat contoh jenis website yang bisa dibuat.</p>
          </div>
          <div className="show-nav">
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

        <div
          ref={scrollerRef}
          className="show-scroller reveal"
          role="region"
          aria-label="Contoh jenis website"
          tabIndex={0}
        >
          {showcaseItems.map((item) => (
            <article key={item.title} className="show-card">
              <div
                className={cn(
                  'show-visual',
                  toneClass[item.tone],
                  item.serif && 'show-visual-serif',
                )}
                aria-hidden="true"
              >
                <small>{item.kicker}</small>
                <h3>{item.heading}</h3>
                <div className={cn('show-pattern', patternClass[item.pattern])} />
              </div>
              <div className="show-meta">
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
