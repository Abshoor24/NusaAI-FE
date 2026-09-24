import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { 
  Plus, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Cpu, 
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react'
import { authApi, type User } from '@/lib/api/auth'

export default function NusaAISettingsApp() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
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

  const displayName = user?.name || user?.username || 'User'
  const displayEmail = user?.email || 'user@example.com'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] font-sans text-neutral-900 antialiased selection:bg-black selection:text-white">
      
      {/* ========================================== */}
      {/* 1. SIDEBAR (Left Panel)                    */}
      {/* ========================================== */}
      <aside className="flex w-72 flex-col justify-between border-r border-neutral-200/80 bg-[#F3F4F6] p-4 select-none">
        <div className="flex flex-col space-y-5">
          
          {/* Brand Header */}
          <Link 
            to="/"
            className={`flex items-center space-x-2.5 px-2 pt-1 transition-all duration-500 transform ${
              isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white shadow-md">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-black">
              nusaAI
            </span>
          </Link>

          {/* New Chat Button */}
          <Link
            to="/chat"
            className={`flex w-full items-center justify-center space-x-2 rounded-xl border border-neutral-300 bg-white py-2.5 text-xs font-semibold text-neutral-900 shadow-2xs transition-all duration-200 hover:border-black hover:bg-neutral-50 active:scale-95 transform ${
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Go to Chat</span>
          </Link>

          {/* Navigation Shortcuts */}
          <div className="flex flex-col space-y-2 pt-2">
            <h4 className="px-2 text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Quick Links
            </h4>
            <Link
              to="/chat"
              className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900 transition-all"
            >
              <MessageSquare className="h-4 w-4 text-neutral-400" />
              <span>AI Chat Assistant</span>
            </Link>
            <Link
              to="/settings"
              className="flex items-center space-x-2.5 rounded-xl bg-black px-3 py-2 text-xs font-medium text-white shadow-sm"
            >
              <SettingsIcon className="h-4 w-4 text-white" />
              <span>Profile Settings</span>
            </Link>
          </div>
        </div>

        {/* User Profile Footer */}
        <div 
          className={`mt-auto pt-4 transition-all duration-700 transform ${
            isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between rounded-xl border border-neutral-200/90 bg-white p-2.5 shadow-2xs">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 font-bold text-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="truncate text-xs font-bold text-neutral-900">
                  {displayName}
                </span>
                <span className="truncate text-[10px] text-neutral-400">
                  {displayEmail}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* 2. MAIN CONTENT AREA (Profile Settings)    */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F8F9FA] p-6 md:p-10">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          
          {/* Top Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Profile & Settings
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage your personal profile and account credentials
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-red-600 transition-all shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>

          {/* SECTION 1: User Profile */}
          <section className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">
                User Information
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Active Account
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white text-2xl font-bold shadow-md">
                {isLoading ? (
                  <UserIcon className="h-8 w-8 animate-pulse text-neutral-400" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex flex-1 w-full max-w-xl flex-col space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={isLoading ? 'Loading...' : displayName}
                    className="w-full rounded-xl border border-neutral-200/90 bg-neutral-50/50 px-4 py-2.5 text-xs font-medium text-neutral-800 shadow-2xs cursor-default focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={isLoading ? 'Loading...' : displayEmail}
                    className="w-full rounded-xl border border-neutral-200/90 bg-neutral-50/50 px-4 py-2.5 text-xs font-medium text-neutral-800 shadow-2xs cursor-default focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-neutral-200/70" />

          {/* Account Security Information */}
          <section className="space-y-4">
            <h2 className="text-base font-bold text-neutral-900">
              Security & Session
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">Authentication Method</span>
                <span className="font-semibold text-neutral-800">JWT Bearer Token</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">Session Status</span>
                <span className="font-semibold text-emerald-600">Authenticated</span>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-200"
                >
                  Sign Out of Session
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

    </div>
  )
}