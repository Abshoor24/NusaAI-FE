import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi, type Conversation } from '@/lib/api/conversations'
import { authApi } from '@/lib/api/auth'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { LogoIcon, MoonIcon, SunIcon } from '@/components/ui/icons'
import { 
  MessageSquare, 
  FileText, 
  Plus, 
  PanelLeftClose, 
  PanelLeft, 
  LogOut, 
  Settings as SettingsIcon, 
  Trash2, 
  MoreVertical, 
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  activeConversationId?: string | null
  onSelectConversation?: (id: string | null) => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeConversationId,
  onSelectConversation,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { theme, toggleTheme } = useTheme()

  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null)

  const accountMenuRef = useRef<HTMLDivElement>(null)

  // Fetch current user from query or fallback
  const { data: user } = useQuery({
    queryKey: ['user-me'],
    queryFn: authApi.getMe,
    retry: false,
  })

  // Close account menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. Fetch Conversations List
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: conversationsApi.list,
  })

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (activeConversationId === deletedId) {
        if (onSelectConversation) {
          onSelectConversation(null)
        } else {
          navigate({ to: '/chat' })
        }
      }
    },
  })

  const handleSignOut = () => {
    authApi.logout()
    navigate({ to: '/login' })
  }

  const handleNewChat = () => {
    if (onSelectConversation) {
      onSelectConversation(null)
    }
    navigate({ to: '/chat' })
    if (onCloseMobile) onCloseMobile()
  }

  const handleSelectConv = (id: string) => {
    if (onSelectConversation) {
      onSelectConversation(id)
    }
    navigate({ to: '/chat', search: { c: id } as any })
    if (onCloseMobile) onCloseMobile()
  }

  // Get user info
  const userEmail = user?.email || 'Account'
  const userInitial = userEmail.charAt(0).toUpperCase()

  const navItems = [
    { label: 'Chat', path: '/chat', icon: <MessageSquare className="size-4" /> },
    { label: 'Documents', path: '/documents', icon: <FileText className="size-4" /> },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border text-card-foreground select-none">
      {/* Top Header: Logo + Collapse Button */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-border/60 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-sm tracking-tight text-foreground hover:opacity-80 transition-opacity overflow-hidden"
        >
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0 shadow-xs">
            <LogoIcon className="size-4" />
          </div>
          {!collapsed && <span className="truncate">nusaAI</span>}
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="size-8 text-muted-foreground hover:text-foreground hidden md:flex shrink-0"
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* New Chat Button */}
        <Button
          variant="primary"
          onClick={handleNewChat}
          className={cn(
            'w-full justify-center gap-2 rounded-xl text-xs font-semibold shadow-xs transition-all',
            collapsed ? 'px-0 py-2' : 'px-3 py-2.5'
          )}
          title="New Chat"
        >
          <Plus className="size-4 shrink-0" />
          {!collapsed && <span>New chat</span>}
        </Button>

        {/* Navigation Menu */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path === '/chat' && pathname.startsWith('/chat'))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Recents Section */}
        {!collapsed && (
          <div className="pt-2 space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recents
            </div>

            {isLoadingConversations && (
              <div className="space-y-1.5 px-1 py-1">
                <div className="h-8 rounded-lg bg-muted/50 animate-pulse" />
                <div className="h-8 rounded-lg bg-muted/50 animate-pulse" />
              </div>
            )}

            {!isLoadingConversations && conversations.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">
                No recent conversations
              </div>
            )}

            <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-0.5">
              {conversations.map((conv) => {
                const isSelected = activeConversationId === conv.id
                const isDropdownOpen = dropdownOpenId === conv.id

                return (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                    onClick={() => handleSelectConv(conv.id)}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1 pr-1">
                      <MessageSquare className="size-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{conv.title || 'Untitled Thread'}</span>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDropdownOpenId(isDropdownOpen ? null : conv.id)
                        }}
                        className={cn(
                          'p-1 rounded-md transition-opacity',
                          isDropdownOpen || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                          'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <MoreVertical className="size-3.5" />
                      </button>

                      {/* Dropdown Menu for Delete */}
                      {isDropdownOpen && (
                        <div
                          className="absolute right-0 top-6 z-50 w-36 rounded-xl border border-border bg-popover p-1 shadow-lg text-popover-foreground text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setDropdownOpenId(null)
                              if (window.confirm('Delete this conversation?')) {
                                deleteMutation.mutate(conv.id)
                              }
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Account Menu (Pinned at bottom) */}
      <div className="p-2 border-t border-border/60 shrink-0 relative" ref={accountMenuRef}>
        {/* Dropdown Popover */}
        {accountMenuOpen && (
          <div
            className={cn(
              'absolute bottom-full mb-2 z-50 rounded-2xl border border-border bg-popover p-1.5 shadow-xl text-popover-foreground text-xs space-y-1',
              collapsed ? 'left-2 w-48' : 'left-2 right-2'
            )}
          >
            <div className="px-3 py-2 border-b border-border/50">
              <div className="font-semibold truncate text-foreground">{userEmail}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {user?.role || 'Free Plan'}
              </div>
            </div>

            <Link
              to="/settings"
              onClick={() => {
                setAccountMenuOpen(false)
                if (onCloseMobile) onCloseMobile()
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <SettingsIcon className="size-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <SunIcon className="size-4 text-muted-foreground" />
                  <span>Light mode</span>
                </>
              ) : (
                <>
                  <MoonIcon className="size-4 text-muted-foreground" />
                  <span>Dark mode</span>
                </>
              )}
            </button>

            <div className="pt-1 border-t border-border/50">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Account Trigger Button */}
        <button
          type="button"
          onClick={() => setAccountMenuOpen((prev) => !prev)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl p-2 text-xs font-medium transition-colors hover:bg-muted text-foreground',
            collapsed && 'justify-center p-2'
          )}
          title={collapsed ? userEmail : undefined}
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0 border border-primary/30">
            {userInitial}
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between min-w-0 text-left">
              <div className="truncate">
                <div className="font-semibold truncate text-xs leading-tight">{userEmail}</div>
                <div className="text-[10px] text-muted-foreground">Account</div>
              </div>
              <ChevronUp className={cn('size-4 text-muted-foreground transition-transform', accountMenuOpen && 'rotate-180')} />
            </div>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen shrink-0 transition-all duration-200 z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
