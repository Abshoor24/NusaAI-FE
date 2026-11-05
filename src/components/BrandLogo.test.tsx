// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrandLogo } from './BrandLogo'

describe('BrandLogo', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders two images with dark classes when tone="auto"', () => {
    render(<BrandLogo variant="full" tone="auto" />)
    const images = screen.getAllByAltText('Nusa AI') as HTMLImageElement[]
    expect(images).toHaveLength(2)

    const [blackImg, whiteImg] = images
    expect(blackImg.src).toContain('/brand/logo-full-black.png')
    expect(blackImg.className).toContain('dark:hidden')

    expect(whiteImg.src).toContain('/brand/logo-full-white.png')
    expect(whiteImg.className).toContain('hidden')
    expect(whiteImg.className).toContain('dark:block')
  })

  it('renders only black image when tone="onLight"', () => {
    render(<BrandLogo variant="full" tone="onLight" />)
    const images = screen.getAllByAltText('Nusa AI') as HTMLImageElement[]
    expect(images).toHaveLength(1)
    expect(images[0].src).toContain('/brand/logo-full-black.png')
    expect(images[0].className).not.toContain('dark:hidden')
  })

  it('renders only white image when tone="onDark"', () => {
    render(<BrandLogo variant="full" tone="onDark" />)
    const images = screen.getAllByAltText('Nusa AI') as HTMLImageElement[]
    expect(images).toHaveLength(1)
    expect(images[0].src).toContain('/brand/logo-full-white.png')
    expect(images[0].className).not.toContain('hidden')
  })

  it('matches ratio for variant="full"', () => {
    const height = 32
    const expectedWidth = Math.round(height * (1217 / 192))
    render(<BrandLogo variant="full" height={height} tone="onLight" />)
    const img = screen.getByAltText('Nusa AI') as HTMLImageElement
    expect(img.getAttribute('width')).toBe(String(expectedWidth))
    expect(img.getAttribute('height')).toBe(String(height))
  })

  it('matches ratio for variant="mark"', () => {
    const height = 40
    const expectedWidth = Math.round(height * (336 / 192))
    render(<BrandLogo variant="mark" height={height} tone="onLight" />)
    const img = screen.getByAltText('Nusa AI') as HTMLImageElement
    expect(img.getAttribute('width')).toBe(String(expectedWidth))
    expect(img.getAttribute('height')).toBe(String(height))
    expect(img.src).toContain('/brand/logo-mark-black.png')
  })

  it('has alt="Nusa AI" and decoding="async"', () => {
    render(<BrandLogo tone="onDark" />)
    const img = screen.getByAltText('Nusa AI') as HTMLImageElement
    expect(img.alt).toBe('Nusa AI')
    expect(img.getAttribute('decoding')).toBe('async')
  })
})
