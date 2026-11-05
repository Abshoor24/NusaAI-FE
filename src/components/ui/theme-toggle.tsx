import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils/cn'

export interface ThemeToggleProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  showLabel?: boolean
}

/**
 * Komponen pengalih tema dark/light universal.
 * Memakai hook useTheme, sinkron dengan <html> dan localStorage.
 * Dapat diakses keyboard dan dilengkapi atribut ARIA yang lengkap.
 */
export function ThemeToggle({
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={cn('transition-colors', className)}
    >
      {isDark ? <SunIcon className="size-4 shrink-0" /> : <MoonIcon className="size-4 shrink-0" />}
      {showLabel && <span className="ml-2 text-hint">{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>}
    </Button>
  )
}
