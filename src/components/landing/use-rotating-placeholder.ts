import { useEffect, useState } from 'react'

export type RotatingPlaceholderOptions = {
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  /** Jeda animasi (mis. saat input sedang fokus). */
  paused?: boolean
}

/**
 * Setara TextType React Bits (diketik per karakter, dihapus, lanjut ke
 * kalimat berikut, loop) tetapi keluarannya string untuk atribut
 * `placeholder`, tanpa dependensi baru.
 *
 * Menghormati prefers-reduced-motion: tampilkan teks pertama statis.
 * Tidak ada fakta yang dibuat: teks berasal dari `landing-data`.
 */
export function useRotatingPlaceholder(
  texts: string[],
  options?: RotatingPlaceholderOptions,
): string {
  const { typingSpeed = 45, deletingSpeed = 22, pauseDuration = 1700, paused = false } = options ?? {}
  const [output, setOutput] = useState(texts[0] ?? '')
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (texts.length === 0) {
      setOutput('')
      return
    }
    if (reducedMotion || paused) {
      setOutput(texts[0])
      return
    }
    let cancelled = false
    let sentence = 0
    let char = 0
    let deleting = false
    let timer = 0

    const tick = () => {
      if (cancelled) return
      const current = texts[sentence]
      if (!deleting) {
        char += 1
        setOutput(current.slice(0, char))
        if (char >= current.length) {
          deleting = true
          timer = window.setTimeout(tick, pauseDuration)
          return
        }
        timer = window.setTimeout(tick, typingSpeed)
      } else {
        char -= 1
        setOutput(current.slice(0, char))
        if (char <= 0) {
          deleting = false
          sentence = (sentence + 1) % texts.length
          timer = window.setTimeout(tick, 350)
          return
        }
        timer = window.setTimeout(tick, deletingSpeed)
      }
    }

    timer = window.setTimeout(tick, 600)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [texts, typingSpeed, deletingSpeed, pauseDuration, paused, reducedMotion])

  return output
}
