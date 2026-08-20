export type NavigationIconName =
  | 'home'
  | 'activities'
  | 'focus'
  | 'history'
  | 'more'
  | 'settings'
  | 'stats'
  | 'export'

export function NavigationIcon({ name }: { name: NavigationIconName }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'home') {
    return (
      <svg {...commonProps}>
        <path d="M3.5 10.2 12 3l8.5 7.2" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    )
  }

  if (name === 'activities') {
    return (
      <svg {...commonProps}>
        <rect x="5" y="4.5" width="14" height="16" rx="2.2" />
        <path d="M8.5 2.5v4M15.5 2.5v4M8 10h8M8 14h5" />
      </svg>
    )
  }

  if (name === 'focus') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
      </svg>
    )
  }

  if (name === 'history') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3.2 2M5.8 5.8 3.8 5.5 4 3.5" />
      </svg>
    )
  }

  if (name === 'settings') {
    return (
      <svg {...commonProps}>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10M9 4v6M15 14v6" />
        <circle cx="9" cy="7" r="2" />
        <circle cx="15" cy="17" r="2" />
      </svg>
    )
  }

  if (name === 'stats') {
    return (
      <svg {...commonProps}>
        <path d="M5 20V11M12 20V5M19 20v-7" />
        <path d="M3 20h18" />
      </svg>
    )
  }

  if (name === 'export') {
    return (
      <svg {...commonProps}>
        <path d="M12 3v12M8 7l4-4 4 4" />
        <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function BrandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m7.5 12 3 3 6-7" />
    </svg>
  )
}
