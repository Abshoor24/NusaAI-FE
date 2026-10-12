import { useEffect, useRef } from 'react'
import { useCases } from './landing-data'

const COPIES = 4

/**
 * Setara ScrollVelocity React Bits (marquee yang lajunya bertambah mengikuti
 * kecepatan scroll, plus sedikit skew) tanpa dependensi baru: rAF +
 * peluruhan halus. Berhenti saat di luar layar (IntersectionObserver) dan
 * statis bila prefers-reduced-motion.
 *
 * Isi memakai data `useCases` yang sama dengan strip lama, jadi tidak ada
 * konten ganda: strip statis lama digantikan komponen ini.
 * Pil di sini teks polos (bukan tombol): versi yang bisa diklik sudah ada
 * di kolom hero, sehingga tidak ada kontrol mati (R-26).
 */
export function VelocityStrip() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const track = trackRef.current
    if (!wrap || !track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let x = 0
    let boost = 0
    let skew = 0
    let lastY = window.scrollY
    let last = performance.now()
    let visible = true
    const BASE_PX_PER_SEC = 60

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0 },
    )
    observer.observe(wrap)

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const y = window.scrollY
      const scrollVelocity = (y - lastY) / Math.max(dt, 0.001)
      lastY = y

      boost += (Math.min(Math.abs(scrollVelocity) / 8, 600) - boost) * 0.06
      const targetSkew = Math.max(-5, Math.min(5, scrollVelocity / 500))
      skew += (targetSkew - skew) * 0.08

      const half = track.scrollWidth / 2
      if (visible && half > 0) {
        x -= (BASE_PX_PER_SEC + boost) * dt
        if (-x >= half) x += half
        track.style.transform = `translate3d(${x}px, 0, 0) skewX(${skew.toFixed(2)}deg)`
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  const sequence = (
    <>
      <span className="velocity-label">Cocok untuk membuat</span>
      {useCases.map((item) => (
        <span key={item} className="velocity-pill">
          {item}
        </span>
      ))}
    </>
  )

  return (
    <div ref={wrapRef} className="velocity-strip" role="region" aria-label="Jenis website yang cocok dibuat">
      <div ref={trackRef} className="velocity-track">
        {Array.from({ length: COPIES }, (_, copy) => (
          <div key={copy} className="velocity-copy" aria-hidden={copy > 0}>
            {sequence}
          </div>
        ))}
      </div>
    </div>
  )
}
