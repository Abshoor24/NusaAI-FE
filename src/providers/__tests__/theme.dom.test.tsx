// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../theme-provider'
import { useTheme } from '../theme-context'
import { ThemeToggle } from '@/components/ui/theme-toggle'

function ThemeConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={toggleTheme}>Toggle</button>
      <ThemeToggle />
    </div>
  )
}

describe('Theme System', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('menyediakan theme default dan resolvedTheme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(['light', 'dark']).toContain(screen.getByTestId('resolved').textContent)
  })

  it('mengubah theme ke dark dan menambahkan class dark pada <html>', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Set Dark'))

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')
  })

  it('mengubah theme ke light dan menghapus class dark dari <html>', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Set Dark'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await user.click(screen.getByText('Set Light'))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(window.localStorage.getItem('theme')).toBe('light')
  })

  it('toggleTheme membalikkan theme antara light dan dark', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Set Light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await user.click(screen.getByText('Toggle'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')

    await user.click(screen.getByText('Toggle'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
  })

  it('ThemeToggle memiliki aria-label dan aria-pressed yang benar', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('Set Light'))
    const toggleBtn = screen.getByRole('button', { name: /beralih ke mode gelap/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggleBtn)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(toggleBtn).toHaveAttribute('aria-label', expect.stringMatching(/beralih ke mode terang/i))
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
