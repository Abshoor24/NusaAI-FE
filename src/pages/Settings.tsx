import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { 
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react'
import { authApi, type UserResponse } from '@/lib/api/auth'
import { Container } from '@/components/ui/container'

export default function NusaAISettingsApp() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isCancelled = false

    authApi.getMe()
      .then((data) => {
        if (!isCancelled) setUser(data)
      })
      .catch((err) => {
        console.warn('Failed to fetch user profile:', err)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const handleLogout = () => {
    authApi.logout()
    navigate({ to: '/login' })
  }

  const displayName = user?.email ? user.email.split('@')[0] : 'User'
  const displayEmail = user?.email || 'user@example.com'

  return (
    <Container className="py-8 max-w-4xl space-y-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Profile & Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal profile and account credentials
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted hover:text-destructive transition-all shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>

      {/* SECTION 1: User Profile */}
      <section className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            User Information
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3" />
            Active Account
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-xs">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-md">
            {isLoading ? (
              <UserIcon className="h-8 w-8 animate-pulse opacity-70" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex flex-1 w-full max-w-xl flex-col space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Full Name
              </label>
              <input
                type="text"
                readOnly
                value={isLoading ? 'Loading...' : displayName}
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-foreground shadow-xs cursor-default focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                readOnly
                value={isLoading ? 'Loading...' : displayEmail}
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-foreground shadow-xs cursor-default focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Account Security Information */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground">
          Security & Session
        </h2>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Authentication Method</span>
            <span className="font-semibold text-foreground">JWT Bearer Token</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Session Status</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Authenticated</span>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-all border border-destructive/20"
            >
              Sign Out of Session
            </button>
          </div>
        </div>
      </section>
    </Container>
  )
}