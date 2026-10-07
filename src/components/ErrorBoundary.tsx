import { Component } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { reportError } from '@/lib/error-report'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Error boundary global: error tak terduga tampil generik
 * tanpa membocorkan detail internal.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown): void {
    // Detail hanya ke console (dev), tidak ke UI.
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] uncaught error')
    }
    // Lapor ke endpoint bila dikonfigurasi (tanpa token/HTML, lihat lib).
    reportError(error)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Container className="flex min-h-[60vh] items-center justify-center py-section">
          <div className="flex max-w-md flex-col items-center gap-stack-md text-center">
            <h1 className="text-title font-bold tracking-tight">Terjadi kesalahan</h1>
            <p className="max-w-prose text-control text-muted-foreground">
              Maaf, terjadi kesalahan tak terduga. Silakan muat ulang halaman.
            </p>
            <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
          </div>
        </Container>
      )
    }
    return this.props.children
  }
}
