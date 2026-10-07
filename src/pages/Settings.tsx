import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  LogOut,
  User as UserIcon,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { authApi, type UserResponse } from '@/lib/api/auth'
import { getErrorMessage } from '@/lib/api/errors'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { Container } from '@/components/ui/container'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; user: UserResponse }
  | { status: 'error'; message: string }

export default function SettingsPage() {
  useDocumentTitle('Profil & Pengaturan | Pakhir Studio')
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileState>({ status: 'loading' })

  const loadProfile = () => {
    setProfile({ status: 'loading' })
    let isCancelled = false

    authApi.getMe()
      .then((data) => {
        if (!isCancelled) setProfile({ status: 'ready', user: data })
      })
      .catch((err: unknown) => {
        if (!isCancelled) setProfile({ status: 'error', message: getErrorMessage(err) })
      })

    return () => {
      isCancelled = true
    }
  }

  useEffect(loadProfile, [])

  const handleLogout = () => {
    authApi.logout()
    navigate({ to: '/login' })
  }

  const displayName =
    profile.status === 'ready' ? profile.user.email.split('@')[0] : '—'
  const displayEmail = profile.status === 'ready' ? profile.user.email : '—'

  return (
    // Wadah scroll halaman (bukan <main>): min-h-0 + flex-1 agar menyusut
    // mengikuti <main> yang overflow-clip, lalu menggulir di dalam sendiri.
    <Container className="py-page max-w-4xl space-y-section min-h-0 flex-1 overflow-y-auto">
      {/* Bilah atas */}
      <div className="flex items-center justify-between gap-stack pb-section-sm border-b border-border">
        <div>
          <h1 className="text-title font-bold tracking-tight text-foreground">
            Profil & Pengaturan
          </h1>
          <p className="mt-stack-sm max-w-prose text-control text-muted-foreground">
            Lihat informasi akun dan keluar dari sesi
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="ctl flex min-h-control-min items-center gap-stack-sm px-control py-control-y rounded-lg border border-border bg-card text-control font-medium text-foreground hover:bg-muted hover:text-destructive transition-all shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* SECTION 1: Profil pengguna */}
      <section className="space-y-section-sm" aria-live="polite">
        <div className="flex items-center justify-between gap-stack-sm">
          <h2 className="text-body font-bold text-foreground">
            Informasi Pengguna
          </h2>
          {profile.status === 'ready' && (
            <span className="inline-flex items-center gap-stack-sm px-2.5 py-1 rounded-full text-hint font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              Akun aktif
            </span>
          )}
        </div>

        {profile.status === 'loading' && (
          <div className="bg-card p-panel rounded-2xl border border-border shadow-xs">
            <p className="text-control text-muted-foreground">Memuat profil…</p>
          </div>
        )}

        {profile.status === 'error' && (
          <div
            role="alert"
            className="bg-card p-panel rounded-2xl border border-destructive/20 shadow-xs space-y-stack"
          >
            <p className="max-w-prose text-control text-destructive">
              Gagal memuat profil: {profile.message}
            </p>
            <button
              onClick={loadProfile}
              className="ctl inline-flex min-h-control-min items-center gap-stack-sm px-control py-control-y rounded-lg border border-border text-control font-medium hover:bg-muted transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba lagi
            </button>
          </div>
        )}

        {profile.status === 'ready' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-section-sm bg-card p-panel rounded-2xl border border-border shadow-xs">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-md"
              aria-hidden="true"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            <dl className="flex flex-1 w-full max-w-xl flex-col space-y-field">
              <div>
                <dt className="mb-label block text-hint font-semibold text-muted-foreground">
                  Nama
                </dt>
                <dd className="w-full rounded-xl border border-border bg-muted/50 px-control py-control-y text-control font-medium text-foreground shadow-xs">
                  {displayName}
                </dd>
              </div>
              <div>
                <dt className="mb-label block text-hint font-semibold text-muted-foreground">
                  Alamat email
                </dt>
                <dd className="w-full rounded-xl border border-border bg-muted/50 px-control py-control-y text-control font-medium text-foreground shadow-xs">
                  {displayEmail}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <hr className="border-border" />

      {/* Keamanan & sesi */}
      <section className="space-y-stack">
        <h2 className="text-body font-bold text-foreground">
          Keamanan & Sesi
        </h2>
        <div className="bg-card p-panel rounded-2xl border border-border shadow-xs space-y-stack">
          <div className="flex items-center justify-between gap-stack-sm text-control">
            <span className="text-muted-foreground font-medium">Metode masuk</span>
            <span className="font-semibold text-foreground">Token JWT Bearer</span>
          </div>
          <div className="flex items-center justify-between gap-stack-sm text-control">
            <span className="text-muted-foreground font-medium">Status sesi</span>
            {profile.status === 'ready' ? (
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                <UserIcon className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                Masuk
              </span>
            ) : profile.status === 'loading' ? (
              <span className="font-semibold text-muted-foreground">Memeriksa…</span>
            ) : (
              <span className="font-semibold text-destructive">Tidak diketahui</span>
            )}
          </div>
          <div className="pt-stack-sm flex justify-end">
            <button
              onClick={handleLogout}
              className="ctl flex min-h-control-min items-center px-control text-control font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-all border border-destructive/20"
            >
              Keluar dari sesi
            </button>
          </div>
        </div>
      </section>
    </Container>
  )
}
