import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BrandLogoProps {
  variant?: 'full' | 'mark'
  tone?: 'auto' | 'onLight' | 'onDark'
  height?: number
  className?: string
}

export function BrandLogo({
  variant = 'full',
  tone = 'auto',
  height = 32,
  className,
}: BrandLogoProps) {
  const ratio = variant === 'full' ? 1217 / 192 : 336 / 192
  const width = Math.round(height * ratio)

  const blackSrc = variant === 'full' ? '/brand/logo-full-black.png' : '/brand/logo-mark-black.png'
  const whiteSrc = variant === 'full' ? '/brand/logo-full-white.png' : '/brand/logo-mark-white.png'

  const commonProps: ImgHTMLAttributes<HTMLImageElement> = {
    alt: 'Nusa AI',
    width,
    height,
    decoding: 'async',
    style: {
      height: `${height}px`,
      width: `${width}px`,
    },
  }

  if (tone === 'onLight') {
    return (
      <img
        src={blackSrc}
        className={cn('shrink-0', className)}
        {...commonProps}
      />
    )
  }

  if (tone === 'onDark') {
    return (
      <img
        src={whiteSrc}
        className={cn('shrink-0', className)}
        {...commonProps}
      />
    )
  }

  return (
    <>
      <img
        src={blackSrc}
        className={cn('shrink-0 dark:hidden', className)}
        {...commonProps}
      />
      <img
        src={whiteSrc}
        className={cn('hidden shrink-0 dark:block', className)}
        {...commonProps}
      />
    </>
  )
}
