import type { SVGProps } from 'react'
import { cn } from '@/lib/utils/cn'

export type LandingIconName = 'arrow' | 'check' | 'file' | 'image' | 'plus' | 'x'

function Base({ className, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('size-5', className)}
      {...props}
    >
      {children}
    </svg>
  )
}

export function LandingIcon({ name, className }: { name: LandingIconName; className?: string }) {
  switch (name) {
    case 'arrow':
      return (
        <Base className={className}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </Base>
      )
    case 'check':
      return (
        <Base className={className}>
          <path d="m5 12 4 4L19 6" />
        </Base>
      )
    case 'file':
      return (
        <Base className={className}>
          <path d="M6 2h8l4 4v16H6z" />
          <path d="M14 2v5h5" />
        </Base>
      )
    case 'image':
      return (
        <Base className={className}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </Base>
      )
    case 'plus':
      return (
        <Base className={className}>
          <path d="M12 5v14M5 12h14" />
        </Base>
      )
    case 'x':
      return (
        <Base className={className}>
          <path d="m6 6 12 12M18 6 6 18" />
        </Base>
      )
  }
}
