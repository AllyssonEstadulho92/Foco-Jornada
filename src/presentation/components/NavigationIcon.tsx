export type NavigationIconName = 'home' | 'tasks' | 'focus' | 'history' | 'more' | 'settings'

interface NavigationIconProps {
  name: NavigationIconName
  size?: number
}

export function NavigationIcon({ name, size = 22 }: NavigationIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="M3 10.8 12 3l9 7.8" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    )
  }

  if (name === 'tasks') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="m8 9 1.5 1.5L12 8" />
        <path d="M14 9h3" />
        <path d="m8 15 1.5 1.5L12 14" />
        <path d="M14 15h3" />
      </svg>
    )
  }

  if (name === 'focus') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="6.5" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
      </svg>
    )
  }

  if (name === 'history') {
    return (
      <svg {...common}>
        <path d="M4.5 7.5V3.5H8.5" />
        <path d="M5 6a8 8 0 1 1-1 8" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    )
  }

  if (name === 'settings') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
