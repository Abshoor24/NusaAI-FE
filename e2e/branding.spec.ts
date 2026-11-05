import { test, expect } from '@playwright/test'

function envelope(data: unknown) {
  return { success: true, message: 'ok', data }
}

function project(title: string) {
  return {
    id: 'p1',
    title,
    status: 'draft',
    brief: { description: 'Deskripsi project untuk pengujian E2E.' },
    version_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

const ROUTES = ['/', '/login', '/register', '/projects']
const THEMES = ['light', 'dark'] as const
const WIDTHS = [360, 768, 1280]

test.describe('Branding E2E', () => {
  for (const theme of THEMES) {
    for (const route of ROUTES) {
      test(`branding verification on ${route} (${theme})`, async ({ page }) => {
        const failedBrandRequests: string[] = []
        page.on('response', (response) => {
          const url = response.url()
          if (url.includes('/brand/') && response.status() >= 400) {
            failedBrandRequests.push(`${url}: status ${response.status()}`)
          }
        })

        await page.addInitScript(({ th }) => {
          window.localStorage.setItem('nusa_auth_token', 'e2e-token')
          window.localStorage.setItem('theme', th)
        }, { th: theme })

        await page.route('**/api/v1/auth/me', (r) =>
          r.fulfill({
            json: envelope({ id: 'u1', email: 'e2e@example.com', created_at: '2026-01-01T00:00:00Z' }),
          }),
        )
        await page.route('**/api/v1/projects**', (r) =>
          r.fulfill({ json: envelope([project('Project Uji')]) }),
        )

        await page.goto(route, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(300)

        // 1. Title verification
        const title = await page.title()
        expect(title).toContain('Nusa AI')
        expect(title.toLowerCase()).not.toContain('pakhir')

        // 2. Visible text has no /pakhir/i
        const bodyText = await page.evaluate(() => document.body.innerText)
        expect(bodyText).not.toMatch(/pakhir/i)

        // 3. Brand images verification
        const brandImgStats = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img[src*="/brand/"]'))
          return imgs.map((img) => {
            const isVisible = typeof img.checkVisibility === 'function'
              ? img.checkVisibility()
              : (img.offsetParent !== null || img.getClientRects().length > 0)
            const rect = img.getBoundingClientRect()
            return {
              src: img.src,
              naturalWidth: img.naturalWidth,
              renderedHeight: rect.height,
              isVisible,
              alt: img.alt,
            }
          })
        })

        for (const stat of brandImgStats) {
          if (stat.isVisible) {
            expect(stat.naturalWidth).toBeGreaterThan(0)
            expect(stat.renderedHeight).toBeGreaterThanOrEqual(20)
            expect(stat.alt).toBe('Nusa AI')
          }
        }

        // 4. Exactly one visible image per BrandLogo slot
        // Slots that render auto tone render two images, exactly one must be visible
        const autoSlotCheck = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img[src*="/brand/"]'))
          // Group by parent element
          const parents = new Set(imgs.map((i) => i.parentElement))
          let ok = true
          parents.forEach((parent) => {
            if (!parent) return
            const childBrandImgs = Array.from(parent.querySelectorAll<HTMLImageElement>(':scope > img[src*="/brand/"]'))
            if (childBrandImgs.length > 1) {
              const visible = childBrandImgs.filter((img) => window.getComputedStyle(img).display !== 'none')
              if (visible.length !== 1) ok = false
            }
          })
          return ok
        })
        expect(autoSlotCheck).toBe(true)

        // 5. No failed /brand/* requests
        expect(failedBrandRequests).toEqual([])
      })
    }
  }

  test('favicon links respond with 200', async ({ request }) => {
    const faviconPaths = [
      '/brand/favicon.ico',
      '/brand/favicon-32.png',
      '/brand/apple-touch-icon.png',
      '/brand/favicon-192.png',
      '/brand/favicon-512.png',
    ]
    for (const p of faviconPaths) {
      const res = await request.get(p)
      expect(res.status(), `Favicon path ${p} should return 200`).toBe(200)
    }
  })

  for (const width of WIDTHS) {
    test(`responsive check at width ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 })

      await page.addInitScript(() => {
        window.localStorage.setItem('nusa_auth_token', 'e2e-token')
        window.localStorage.setItem('theme', 'dark')
      })

      await page.route('**/api/v1/auth/me', (r) =>
        r.fulfill({
          json: envelope({ id: 'u1', email: 'e2e@example.com', created_at: '2026-01-01T00:00:00Z' }),
        }),
      )
      await page.route('**/api/v1/projects**', (r) =>
        r.fulfill({ json: envelope([project('Project Uji')]) }),
      )

      for (const route of ['/', '/projects']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(300)

        const noHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth <= document.documentElement.clientWidth
        })
        expect(noHorizontalScroll, `Route ${route} should not have horizontal scroll at ${width}px`).toBe(true)
      }
    })
  }
})
