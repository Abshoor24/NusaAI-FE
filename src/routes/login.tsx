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
import { BotIcon, AlertTriangleIcon } from '@/components/ui/icons'

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
  useDocumentTitle('Masuk — Pakhir Studio')
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <BotIcon className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Masuk ke Pakhir Studio</CardTitle>
          <CardDescription>
            Masukkan email dan kata sandi untuk membuat website dengan AI
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-2">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive"
              >
                <AlertTriangleIcon className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
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
                <p className="text-[11px] text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
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
                <p className="text-[11px] text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || !email || !password}
            >
              Masuk
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground pt-2">
            <div>
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                Buat akun
              </Link>
            </div>
            <div>
              <Link to="/" className="hover:text-foreground">
                &larr; Kembali ke Beranda
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
