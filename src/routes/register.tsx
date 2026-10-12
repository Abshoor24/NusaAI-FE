import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/api/errors'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { BotIcon, AlertTriangleIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RegisterPage() {
  useDocumentTitle('Buat Akun | Pakhir Studio')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailTaken, setEmailTaken] = useState(false)
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
    } else if (password.length < 8) {
      errors.password = 'Kata sandi minimal 8 karakter'
    } else if (password.length > 72) {
      errors.password = 'Kata sandi maksimal 72 karakter'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)
    setEmailTaken(false)
    setFieldErrors({})

    try {
      await authApi.register({ email: email.trim(), password })
      navigate({ to: '/projects' })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // 409 email terdaftar → tawarkan ke login (BUKAN auto-logout).
        if (err.status === 409 && err.code === 'CONFLICT') {
          setEmailTaken(true)
          setError('Email sudah terdaftar. Silakan masuk.')
        } else if (err.fields) {
          setFieldErrors(err.fields)
        } else {
          setError(getErrorMessage(err))
        }
      } else {
        setError('Pendaftaran gagal. Silakan coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-compact flex min-h-screen items-center justify-center bg-muted/30 p-page">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-stack">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <BotIcon className="size-6" />
          </div>
          <CardTitle className="text-title font-bold tracking-tight">Buat Akun</CardTitle>
          <CardDescription className="max-w-prose">
            Daftar untuk mulai membuat website dengan AI
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
                <span>
                  {error}{' '}
                  {emailTaken && (
                    <Link to="/login" className="font-semibold underline underline-offset-4">
                      Masuk di sini
                    </Link>
                  )}
                </span>
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
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
                }}
                disabled={isLoading}
                required
                minLength={8}
                maxLength={72}
              />
              {fieldErrors.password ? (
                <p className="text-hint text-destructive">{fieldErrors.password}</p>
              ) : (
                <p className="text-hint text-muted-foreground">8 sampai 72 karakter</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-stack-sm"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || !email || !password}
            >
              Buat Akun
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-stack text-center text-hint text-muted-foreground pt-0">
            <div>
              Sudah punya akun?{' '}
              <Link to="/login" className="inline-flex min-h-control-min items-center px-stack-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                Masuk
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
