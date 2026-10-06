import { Children, cloneElement } from 'react'
import type { ButtonHTMLAttributes, ReactElement } from 'react'
import { cn } from '@/lib/utils/cn'
import { Spinner } from './spinner'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  asChild?: boolean
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'size-9',
}

/**
 * Target sentuh per ukuran: 44px di layar kecil (mobile), kembali ke ukuran
 * desain aslinya di layar lebar. Sesuai pedoman target sentuh minimum 44x44px
 * (WCAG 2.5.8) — hanya berlaku di layar kecil, di desktop memakai tetikus.
 */
const touchClassesBySize: Record<ButtonSize, string> = {
  sm: 'min-h-11 md:min-h-8',
  md: 'min-h-11 md:min-h-10',
  lg: 'min-h-11',
  icon: '',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    touchClassesBySize[size],
    className,
  )

  if (asChild) {
    const child = Children.only(children) as ReactElement<Record<string, unknown>>
    return cloneElement(child, {
      ...props,
      className: cn(child.props.className as string | undefined, classes),
    })
  }

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={classes}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}