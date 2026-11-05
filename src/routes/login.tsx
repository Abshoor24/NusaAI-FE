import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'
import { sanitizeRedirect } from '@/lib/redirect'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { AlertTriangleIcon } from '@/components/ui/icons'
import { BrandLogo } from '@/components/BrandLogo'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export const Route = createFileRoute('/login')({
  // `expired` bisa tiba sebagai angka 1 (parseSearch me-JSON-parse nilai).
  validateSearch: (search: Record<string, unknown>): { redirect?: string; expired?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    expired: search.expired === '1' || search.expired === 1 ? '1' : undefined,
  }),
  component: LoginPage,
})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPage() {
  useDocumentTitle('Masuk | Nusa AI')
  const router = useRouter()
  const search = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    search.expired === '1' ? 'Sesi berakhir, silakan login kembali.' : null,
  )
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      errors.email = 'Alamat email wajib diisi'
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Masukkan alamat email yang valid'
    }

    if (!password) {
      errors.password = 'Kata sandi wajib diisi'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      await authApi.login({ email: email.trim(), password })
      // Redirect aman: hanya path internal; query (mis. ?autostart=1)
      // dipertahankan via history.push. Nilai asing → /projects.
      router.history.push(sanitizeRedirect(search.redirect))
    } catch (err: unknown) {
      // 401 login ("Invalid email or password") = pesan form, BUKAN auto-logout.
      if (err instanceof ApiError) {
        if (err.fields) {
          setFieldErrors(err.fields)
        } else {
          setError(getErrorMessage(err))
        }
      } else {
        setError('Gagal masuk. Periksa kembali email dan kata sandi Anda.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-compact relative flex min-h-screen items-center justify-center bg-muted/30 p-page">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-stack">
          <div className="mx-auto flex items-center justify-center">
            <BrandLogo variant="mark" tone="auto" height={40} />
          </div>
          <CardTitle className="text-title font-bold tracking-tight">Masuk ke Nusa AI</CardTitle>
          <CardDescription className="max-w-prose">
            Masukkan email dan kata sandi untuk membuat website dengan AI
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-field pt-0">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-stack-sm rounded-lg bg-destructive/10 border border-destructive/20 p-control text-control text-red-700 dark:text-destructive"
              >
                <AlertTriangleIcon className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-label">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@contoh.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
                }}
                disabled={isLoading}
                autoFocus
                required
              />
              {fieldErrors.email && (
                <p className="text-hint text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-label">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }}
                disabled={isLoading}
                required
              />
              {fieldErrors.password && (
                <p className="text-hint text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-stack-sm"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || !email || !password}
            >
              Masuk
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-stack text-center text-hint text-muted-foreground pt-0">
            <div>
              Belum punya akun?{' '}
              <Link to="/register" className="inline-flex min-h-control-min items-center px-stack-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                Buat akun
              </Link>
            </div>
            <div>
              <Link to="/" className="inline-flex min-h-nav-item items-center hover:text-foreground">
                &larr; Kembali ke Beranda
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
