// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ProjectsPager } from './ProjectsPager'

describe('ProjectsPager', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders navigation with accessible label and status text', () => {
    render(
      <ProjectsPager
        page={2}
        hasMore={true}
        busy={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Navigasi halaman project' })
    expect(nav).toBeInTheDocument()

    const status = screen.getByText('Halaman 2')
    expect(status).toBeInTheDocument()
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('disables "Sebelumnya" on page 1 and enables "Berikutnya" when hasMore is true', () => {
    render(
      <ProjectsPager
        page={1}
        hasMore={true}
        busy={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    const prevButton = screen.getByRole('button', { name: /Sebelumnya/ })
    const nextButton = screen.getByRole('button', { name: /Berikutnya/ })

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeEnabled()
  })

  it('disables "Berikutnya" when hasMore is false and enables "Sebelumnya" when page > 1', () => {
    render(
      <ProjectsPager
        page={3}
        hasMore={false}
        busy={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    const prevButton = screen.getByRole('button', { name: /Sebelumnya/ })
    const nextButton = screen.getByRole('button', { name: /Berikutnya/ })

    expect(prevButton).toBeEnabled()
    expect(nextButton).toBeDisabled()
  })

  it('disables both buttons when busy is true', () => {
    render(
      <ProjectsPager
        page={2}
        hasMore={true}
        busy={true}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    const prevButton = screen.getByRole('button', { name: /Sebelumnya/ })
    const nextButton = screen.getByRole('button', { name: /Berikutnya/ })

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it('calls onPrev when "Sebelumnya" is clicked', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()

    render(
      <ProjectsPager
        page={2}
        hasMore={true}
        busy={false}
        onPrev={onPrev}
        onNext={onNext}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Sebelumnya/ }))
    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('calls onNext when "Berikutnya" is clicked', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()

    render(
      <ProjectsPager
        page={2}
        hasMore={true}
        busy={false}
        onPrev={onPrev}
        onNext={onNext}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Berikutnya/ }))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrev).not.toHaveBeenCalled()
  })
})
