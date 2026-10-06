import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, mockWorkspaceApi, type WorkspaceState } from './workspace-helpers'

test.describe('Workspace actions (Salin HTML & Coba lagi) & Axe', () => {
  test('E2E: Salin HTML di workspace + Axe audit (light & dark mode)', async ({ page }) => {
    await mockLogin(page)
    const state: WorkspaceState = {
      status: 'ready',
      title: 'Salin Website',
      versions: [
        {
          id: 'v1',
          version_number: 1,
          kind: 'generate',
          prompt: 'brief',
          html: '<html><body><h1>Website Salin</h1></body></html>',
        },
      ],
    }
    await mockWorkspaceApi(page, 'p1', state)
    await page.goto('/projects/p1')

    await expect(page.getByRole('heading', { name: 'Salin Website' })).toBeVisible()
    const copyBtn = page.getByRole('button', { name: 'Salin HTML' })
    await expect(copyBtn).toBeVisible()

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await copyBtn.click()
    await expect(page.getByRole('status')).toContainText('HTML berhasil disalin ke clipboard.')

    // Axe check light mode
    const axeLight = await new AxeBuilder({ page }).analyze()
    expect(axeLight.violations).toEqual([])

    // Axe check dark mode
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    const axeDark = await new AxeBuilder({ page }).analyze()
    expect(axeDark.violations).toEqual([])
  })

  test('E2E: Tombol Coba lagi pada status failed + Axe audit', async ({ page }) => {
    await mockLogin(page)
    const state: WorkspaceState = {
      status: 'failed',
      title: 'Project Gagal',
      versions: [],
    }
    await mockWorkspaceApi(page, 'p1', state)
    await page.goto('/projects/p1')

    await expect(page.getByRole('heading', { name: 'Project Gagal' })).toBeVisible()
    const retryBtn = page.getByRole('button', { name: 'Coba Lagi' }).first()
    await expect(retryBtn).toBeVisible()
    await expect(retryBtn).toBeEnabled()

    // Axe check light mode
    const axeLight = await new AxeBuilder({ page }).analyze()
    expect(axeLight.violations).toEqual([])
  })
})
