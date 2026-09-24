import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/auth'
import { BotIcon, AlertTriangleIcon } from '@/components/ui/icons'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOrUsername.trim() || !password) return

    setIsLoading(true)
    setError(null)

    try {
      await authApi.login({
        email: emailOrUsername.includes('@') ? emailOrUsername.trim() : undefined,
        username: !emailOrUsername.includes('@') ? emailOrUsername.trim() : undefined,
        password,
      })
      navigate({ to: (search.redirect as any) || '/chat' })
    } catch (err: unknown) {
      const errObj = err as Error
      setError(errObj.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <BotIcon className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in to nusaAI</CardTitle>
          <CardDescription>
            Enter your credentials to access the AI chat assistant & sandbox
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <AlertTriangleIcon className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="emailOrUsername">Email or Username</Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="name@example.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || !emailOrUsername || !password}
            >
              Sign In
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 text-center text-xs text-muted-foreground pt-2">
            <div>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                Create an account
              </Link>
            </div>
            <div>
              <Link to="/" className="hover:text-foreground">
                &larr; Back to Home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
