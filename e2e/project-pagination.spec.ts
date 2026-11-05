import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

function envelope(data: unknown) {
  return { success: true, message: 'ok', data }
}

function makeProject(id: string, title: string) {
  return {
    id,
    title,
    status: 'draft' as const,
    brief: { description: `Deskripsi untuk ${title}` },
    version_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

async function setupProjectsMock(
  page: import('@playwright/test').Page,
  initialProjects: ReturnType<typeof makeProject>[],
) {
  let projectList = [...initialProjects]
  const requests: { limit: number; offset: number }[] = []

  await page.addInitScript(() => {
    window.localStorage.setItem('nusa_auth_token', 'e2e-token')
  })

  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: envelope({ id: 'u1', email: 'e2e@example.com', created_at: '2026-01-01T00:00:00Z' }),
    }),
  )

  await page.route('**/api/v1/projects**', (route) => {
    const method = route.request().method()
    const url = new URL(route.request().url())

    if (method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20', 10)
      const offset = parseInt(url.searchParams.get('offset') || '0', 10)
      requests.push({ limit, offset })
      const sliced = projectList.slice(offset, offset + limit)
      return route.fulfill({ json: envelope(sliced) })
    }

    if (method === 'DELETE') {
      const parts = url.pathname.split('/')
      const deleteId = parts[parts.length - 1]
      projectList = projectList.filter((p) => p.id !== deleteId)
      return route.fulfill({ json: { success: true, message: 'Deleted', data: null } })
    }

    return route.continue()
  })

  return { requests, getProjects: () => projectList }
}

test.describe('Project Pagination E2E', () => {
  test('S1: 4 projects: 4 cards, no pager', async ({ page }) => {
    const projects = Array.from({ length: 4 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'Project Saya' })).toBeVisible()

    const cards = page.locator('ul[aria-label="Daftar project"] > li')
    await expect(cards).toHaveCount(4)

    // Pager tidak tampil karena page = 1 dan hasMore = false
    await expect(page.getByRole('navigation', { name: 'Navigasi halaman project' })).toBeHidden()
  })

  test('S2: exactly 6 projects: 6 cards, no pager, request used limit=7', async ({ page }) => {
    const projects = Array.from({ length: 6 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    const { requests } = await setupProjectsMock(page, projects)

    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'Project Saya' })).toBeVisible()

    const cards = page.locator('ul[aria-label="Daftar project"] > li')
    await expect(cards).toHaveCount(6)

    // Tidak ada pager
    await expect(page.getByRole('navigation', { name: 'Navigasi halaman project' })).toBeHidden()

    // Membuktikan request memakai limit=7 (PAGE_SIZE + 1)
    const listReq = requests.find((r) => r.offset === 0)
    expect(listReq).toBeDefined()
    expect(listReq?.limit).toBe(7)
  })

  test('S3: 14 projects pagination flow', async ({ page }) => {
    const projects = Array.from({ length: 14 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'Project Saya' })).toBeVisible()

    const cards = page.locator('ul[aria-label="Daftar project"] > li')
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toContainText('Project 1')
    await expect(cards.last()).toContainText('Project 6')

    const pager = page.getByRole('navigation', { name: 'Navigasi halaman project' })
    await expect(pager).toBeVisible()

    const prevButton = pager.getByRole('button', { name: 'Sebelumnya' })
    const nextButton = pager.getByRole('button', { name: 'Berikutnya' })

    // Page 1: Sebelumnya disabled, Berikutnya enabled
    await expect(prevButton).toBeDisabled()
    await expect(nextButton).toBeEnabled()
    await expect(pager.getByText('Halaman 1')).toBeVisible()

    // Klik Berikutnya -> Page 2
    await nextButton.click()
    await expect(page).toHaveURL(/\/projects\?page=2/)
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toContainText('Project 7')
    await expect(cards.last()).toContainText('Project 12')
    await expect(prevButton).toBeEnabled()
    await expect(nextButton).toBeEnabled()
    await expect(pager.getByText('Halaman 2')).toBeVisible()

    // Klik Berikutnya -> Page 3
    await nextButton.click()
    await expect(page).toHaveURL(/\/projects\?page=3/)
    await expect(cards).toHaveCount(2)
    await expect(cards.first()).toContainText('Project 13')
    await expect(cards.last()).toContainText('Project 14')
    await expect(prevButton).toBeEnabled()
    await expect(nextButton).toBeDisabled()
    await expect(pager.getByText('Halaman 3')).toBeVisible()

    // Klik Sebelumnya -> Page 2
    await prevButton.click()
    await expect(page).toHaveURL(/\/projects\?page=2/)
    await expect(cards).toHaveCount(6)
    await expect(pager.getByText('Halaman 2')).toBeVisible()

    // Klik Sebelumnya -> Page 1 (URL kembali polos tanpa parameter page)
    await prevButton.click()
    await expect(page).toHaveURL(/\/projects(?!\?page)/)
    await expect(cards).toHaveCount(6)
    await expect(prevButton).toBeDisabled()
    await expect(pager.getByText('Halaman 1')).toBeVisible()
  })

  test('S4: reload on ?page=2 stays on page 2; browser Back returns to previous page', async ({
    page,
  }) => {
    const projects = Array.from({ length: 14 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    await page.goto('/projects?page=2')
    const cards = page.locator('ul[aria-label="Daftar project"] > li')
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toContainText('Project 7')

    // Reload
    await page.reload()
    await expect(page).toHaveURL(/\/projects\?page=2/)
    await expect(cards.first()).toContainText('Project 7')

    // Pindah ke page 3 lalu klik Back
    const nextButton = page.getByRole('button', { name: 'Berikutnya' })
    await nextButton.click()
    await expect(page).toHaveURL(/\/projects\?page=3/)
    await expect(cards).toHaveCount(2)

    await page.goBack()
    await expect(page).toHaveURL(/\/projects\?page=2/)
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toContainText('Project 7')
  })

  test('S5: invalid page params fall back to page 1', async ({ page }) => {
    const projects = Array.from({ length: 14 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    for (const invalid of ['/projects?page=abc', '/projects?page=0', '/projects?page=-3']) {
      await page.goto(invalid)
      await expect(page).toHaveURL(/\/projects(?!\?page)/)
      const cards = page.locator('ul[aria-label="Daftar project"] > li')
      await expect(cards.first()).toContainText('Project 1')
    }

    // page=99 yang tidak memiliki item jatuh kembali ke page 1
    await page.goto('/projects?page=99')
    await expect(page).toHaveURL(/\/projects(?!\?page)/)
    const cards = page.locator('ul[aria-label="Daftar project"] > li')
    await expect(cards.first()).toContainText('Project 1')
  })

  test('S6: 13 projects, delete single item on page 3 -> lands on page 2', async ({ page }) => {
    const projects = Array.from({ length: 13 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    await page.goto('/projects?page=3')
    const cards = page.locator('ul[aria-label="Daftar project"] > li')
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Project 13')

    // Hapus project tunggal di page 3
    await page.getByRole('button', { name: /Hapus Project 13/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Ya, Hapus' }).click()

    // Harus mendarat di page 2, bukan jatuh ke page 1
    await expect(page).toHaveURL(/\/projects\?page=2/)
    await expect(cards).toHaveCount(6)
    await expect(cards.first()).toContainText('Project 7')
  })

  test('S7: a11y, heading focus, 44px targets, and no 360px horizontal scroll', async ({ page }) => {
    const projects = Array.from({ length: 14 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    // Uji axe light mode
    await page.addInitScript(() => window.localStorage.setItem('theme', 'light'))
    await page.goto('/projects?page=2', { waitUntil: 'networkidle' })
    const axeLight = await new AxeBuilder({ page }).analyze()
    const lightSerious = axeLight.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(lightSerious).toEqual([])

    // Uji axe dark mode
    await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'))
    await page.goto('/projects?page=2', { waitUntil: 'networkidle' })
    const axeDark = await new AxeBuilder({ page }).analyze()
    const darkSerious = axeDark.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(darkSerious).toEqual([])

    // Focus on heading after Next
    const nextButton = page.getByRole('button', { name: 'Berikutnya' })
    await nextButton.click()
    await expect(page.getByRole('heading', { name: 'Project Saya' })).toBeFocused()

    // Target buttons >= 44px
    const prevBtn = page.getByRole('button', { name: 'Sebelumnya' })
    const prevBox = await prevBtn.boundingBox()
    expect(prevBox).toBeDefined()
    expect(prevBox!.height).toBeGreaterThanOrEqual(44)

    const nextBox = await nextButton.boundingBox()
    expect(nextBox).toBeDefined()
    expect(nextBox!.height).toBeGreaterThanOrEqual(44)

    // Tab dan Enter mengoperasikan pager
    await prevBtn.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/projects\?page=2/)

    // 360px: tidak ada horizontal scroll
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/projects?page=2')
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('S8: 6 projects responsive grid at 1440, 1366, 1920, 1024, 768, 360', async ({ page }) => {
    const projects = Array.from({ length: 6 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    // 1440x900: 3 kolom x 2 baris
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/projects')
    const cards = page.locator('ul[aria-label="Daftar project"] > li')
    await expect(cards).toHaveCount(6)

    const boxes = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => cards.nth(i).boundingBox()))
    expect(boxes.every((b) => b !== null)).toBe(true)

    // Baris 1: 3 kartu pertama punya koordinat Y yang sama
    expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(3)
    expect(Math.abs(boxes[1]!.y - boxes[2]!.y)).toBeLessThan(3)

    // Baris 2: 3 kartu berikutnya punya koordinat Y yang sama dan lebih besar
    expect(Math.abs(boxes[3]!.y - boxes[4]!.y)).toBeLessThan(3)
    expect(Math.abs(boxes[4]!.y - boxes[5]!.y)).toBeLessThan(3)
    expect(boxes[3]!.y).toBeGreaterThan(boxes[0]!.y + 100)

    // Lebar kartu >= 280px dan tinggi setara dalam satu baris
    for (const b of boxes) {
      expect(b!.width).toBeGreaterThanOrEqual(280)
    }
    expect(Math.abs(boxes[0]!.height - boxes[1]!.height)).toBeLessThan(3)
    expect(Math.abs(boxes[1]!.height - boxes[2]!.height)).toBeLessThan(3)

    // 1366x768: 3 kolom
    await page.setViewportSize({ width: 1366, height: 768 })
    const b1366_0 = await cards.nth(0).boundingBox()
    const b1366_1 = await cards.nth(1).boundingBox()
    const b1366_2 = await cards.nth(2).boundingBox()
    expect(Math.abs(b1366_0!.y - b1366_1!.y)).toBeLessThan(3)
    expect(Math.abs(b1366_1!.y - b1366_2!.y)).toBeLessThan(3)
    expect(b1366_0!.width).toBeGreaterThanOrEqual(280)

    // 1920x1080: 3 kolom
    await page.setViewportSize({ width: 1920, height: 1080 })
    const b1920_0 = await cards.nth(0).boundingBox()
    const b1920_1 = await cards.nth(1).boundingBox()
    const b1920_2 = await cards.nth(2).boundingBox()
    expect(Math.abs(b1920_0!.y - b1920_1!.y)).toBeLessThan(3)
    expect(Math.abs(b1920_1!.y - b1920_2!.y)).toBeLessThan(3)
    expect(b1920_0!.width).toBeGreaterThanOrEqual(280)

    // 1024x768: 2 kolom (lg)
    await page.setViewportSize({ width: 1024, height: 768 })
    const b1024_0 = await cards.nth(0).boundingBox()
    const b1024_1 = await cards.nth(1).boundingBox()
    const b1024_2 = await cards.nth(2).boundingBox()
    expect(Math.abs(b1024_0!.y - b1024_1!.y)).toBeLessThan(3)
    expect(b1024_2!.y).toBeGreaterThan(b1024_0!.y + 100)
    expect(b1024_0!.width).toBeGreaterThanOrEqual(280)

    // 768x1024: 1 kolom
    await page.setViewportSize({ width: 768, height: 1024 })
    const b768_0 = await cards.nth(0).boundingBox()
    const b768_1 = await cards.nth(1).boundingBox()
    expect(b768_1!.y).toBeGreaterThan(b768_0!.y + 100)
    expect(b768_0!.width).toBeGreaterThanOrEqual(280)

    // 360x740: 1 kolom tanpa horizontal overflow
    await page.setViewportSize({ width: 360, height: 740 })
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(hasOverflow).toBe(false)
  })

  test('S9: 14 projects grid layout across pages', async ({ page }) => {
    const projects = Array.from({ length: 14 }, (_, i) => makeProject(`p${i}`, `Project ${i + 1}`))
    await setupProjectsMock(page, projects)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/projects')
    const cards = page.locator('ul[aria-label="Daftar project"] > li')

    // Page 1: 6 kartu (3x2)
    await expect(cards).toHaveCount(6)

    // Page 2: 6 kartu (3x2)
    await page.getByRole('button', { name: 'Berikutnya' }).click()
    await expect(page).toHaveURL(/\/projects\?page=2/)
    await expect(cards).toHaveCount(6)

    // Page 3: 2 kartu dalam 1 baris
    await page.getByRole('button', { name: 'Berikutnya' }).click()
    await expect(page).toHaveURL(/\/projects\?page=3/)
    await expect(cards).toHaveCount(2)
    const b0 = await cards.nth(0).boundingBox()
    const b1 = await cards.nth(1).boundingBox()
    expect(Math.abs(b0!.y - b1!.y)).toBeLessThan(3)
  })
})
