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
  useDocumentTitle('Profil & Pengaturan — Pakhir Studio')
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
    <Container className="py-8 max-w-4xl space-y-8 min-h-0 flex-1 overflow-y-auto">
      {/* Bilah atas */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Profil & Pengaturan
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lihat informasi akun dan keluar dari sesi
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted hover:text-destructive transition-all shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* SECTION 1: Profil pengguna */}
      <section className="space-y-6 pt-2" aria-live="polite">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Informasi Pengguna
          </h2>
          {profile.status === 'ready' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              Akun aktif
            </span>
          )}
        </div>

        {profile.status === 'loading' && (
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs">
            <p className="text-xs text-muted-foreground">Memuat profil…</p>
          </div>
        )}

        {profile.status === 'error' && (
          <div
            role="alert"
            className="bg-card p-6 rounded-2xl border border-destructive/20 shadow-xs space-y-3"
          >
            <p className="text-xs text-destructive">
              Gagal memuat profil: {profile.message}
            </p>
            <button
              onClick={loadProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba lagi
            </button>
          </div>
        )}

        {profile.status === 'ready' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-xs">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-md"
              aria-hidden="true"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            <dl className="flex flex-1 w-full max-w-xl flex-col space-y-4">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Nama
                </dt>
                <dd className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-foreground shadow-xs">
                  {displayName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Alamat email
                </dt>
                <dd className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-foreground shadow-xs">
                  {displayEmail}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <hr className="border-border" />

      {/* Keamanan & sesi */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground">
          Keamanan & Sesi
        </h2>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Metode masuk</span>
            <span className="font-semibold text-foreground">Token JWT Bearer</span>
          </div>
          <div className="flex items-center justify-between text-xs">
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
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-all border border-destructive/20"
            >
              Keluar dari sesi
            </button>
          </div>
        </div>
      </section>
    </Container>
  )
}
