import type { SVGProps } from 'react'

export function GloLogo({ className = '', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 44"
      className={['gloBrandLogo', className].filter(Boolean).join(' ')}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g
        fill="none"
        stroke="var(--glo-logo-ink, #4a4d57)"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="15" cy="18" r="10" />
        <path d="M25 18v9.4c0 7.6-4.4 11.6-11.2 11.6" />
        <path d="M33.5 5v26" />
        <circle cx="49.5" cy="18" r="10" />
      </g>
      <circle cx="49.5" cy="18" r="7.3" fill="#ea5608" />
    </svg>
  )
}
