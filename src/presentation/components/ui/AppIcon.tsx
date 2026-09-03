import type { SVGProps } from 'react'

export type AppIconName =
  | 'home'
  | 'activities'
  | 'focus'
  | 'history'
  | 'more'
  | 'settings'
  | 'stats'
  | 'payroll'
  | 'hours'
  | 'guide'
  | 'export'
  | 'bell'
  | 'check'
  | 'clock'
  | 'lock'
  | 'menu'
  | 'edit'
  | 'trash'
  | 'calendar'
  | 'medication'
  | 'close'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'search'
  | 'info'
  | 'warning'
  | 'play'
  | 'pause'
  | 'sparkle'
  | 'list'
  | 'upload'
  | 'download'
  | 'cloud'
  | 'coffee'
  | 'shield'
  | 'wallet'
  | 'meal'
  | 'minus-circle'
  | 'target'
  | 'document'
  | 'note'
  | 'user'
  | 'plus'
  | 'status'
  | 'break'
  | 'journey'
  | 'phone'
  | 'monitor'
  | 'globe'

export type AppIconMotion = 'none' | 'ring' | 'pulse' | 'draw' | 'float'

export interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: AppIconName
  motion?: AppIconMotion
}

function iconContent(name: AppIconName) {
  if (name === 'home') {
    return <>
      <path d="M3.5 10.2 12 3l8.5 7.2" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  }
  if (name === 'activities') {
    return <>
      <rect x="5" y="4.5" width="14" height="16" rx="2.2" />
      <path d="M8.5 2.5v4M15.5 2.5v4M8 10h8M8 14h5" />
    </>
  }
  if (name === 'focus' || name === 'target') {
    return <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </>
  }
  if (name === 'history') {
    return <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2M5.8 5.8 3.8 5.5 4 3.5" />
    </>
  }
  if (name === 'more') {
    return <>
      <circle cx="6" cy="6" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18" cy="6" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="6" cy="18" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18" cy="18" r="1.35" fill="currentColor" stroke="none" />
    </>
  }
  if (name === 'settings') {
    return <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.6h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4.04v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.04h-.1A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  }
  if (name === 'stats') {
    return <>
      <path d="M5 20V11M12 20V5M19 20v-7" />
      <path d="M3 20h18" />
    </>
  }
  if (name === 'payroll' || name === 'wallet') {
    return <>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M7 5V3h10v2M14.5 11h5.5v4h-5.5a2 2 0 0 1 0-4Z" />
      <circle cx="16.5" cy="13" r=".7" fill="currentColor" stroke="none" />
    </>
  }
  if (name === 'hours' || name === 'clock') {
    return <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.5 2" />
    </>
  }
  if (name === 'guide') {
    return <>
      <path d="M4.5 4.5h5.8A2.7 2.7 0 0 1 13 7.2V20a3.2 3.2 0 0 0-3-2H4.5z" />
      <path d="M19.5 4.5h-5.8A2.7 2.7 0 0 0 11 7.2V20a3.2 3.2 0 0 1 3-2h5.5z" />
    </>
  }
  if (name === 'export' || name === 'upload') {
    return <>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </>
  }
  if (name === 'download') {
    return <>
      <path d="M12 3v12M8 11l4 4 4-4" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </>
  }
  if (name === 'bell') {
    return <>
      <g className="appIconBellBody">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M10 20h4" className="appIconBellClapper" />
      </g>
      <path d="M4.8 6.5c.45-.95 1.05-1.8 1.8-2.5" className="appIconBellWave appIconBellWaveLeft" />
      <path d="M19.2 6.5c-.45-.95-1.05-1.8-1.8-2.5" className="appIconBellWave appIconBellWaveRight" />
    </>
  }
  if (name === 'check') {
    return <>
      <circle className="appIconCheckRing" cx="12" cy="12" r="8.5" />
      <path className="appIconCheckPath" d="m7.5 12.5 3.1 3.1 6.2-7" />
    </>
  }
  if (name === 'lock') {
    return <>
      <rect x="5.5" y="10" width="13" height="10" rx="2" />
      <path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
    </>
  }
  if (name === 'menu') return <path d="M5 7h14M5 12h14M5 17h14" />
  if (name === 'edit') {
    return <>
      <path d="m4 16-.5 4.5L8 20l10.2-10.2-4-4L4 16Z" />
      <path d="m12.8 7.2 4 4" />
    </>
  }
  if (name === 'trash') {
    return <>
      <path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 13h8l1-13" />
    </>
  }
  if (name === 'calendar') {
    return <>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  }
  if (name === 'medication') {
    return <>
      <path d="M8.1 4.6a4.4 4.4 0 0 1 6.2 0l5.1 5.1a4.4 4.4 0 0 1-6.2 6.2L8.1 10.8a4.4 4.4 0 0 1 0-6.2Z" />
      <path d="m10.2 12.9 6.2-6.2" />
    </>
  }
  if (name === 'close') return <path d="m6 6 12 12M18 6 6 18" />
  if (name === 'chevron-right') return <path d="m9 5 7 7-7 7" />
  if (name === 'chevron-left') return <path d="m15 5-7 7 7 7" />
  if (name === 'chevron-down') return <path d="m5 9 7 7 7-7" />
  if (name === 'search') {
    return <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  }
  if (name === 'info') {
    return <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  }
  if (name === 'warning') {
    return <>
      <path d="M12 3 21 20H3L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  }
  if (name === 'play') return <path d="m9 6 9 6-9 6V6Z" />
  if (name === 'pause') return <path d="M8.5 6v12M15.5 6v12" />
  if (name === 'sparkle') {
    return <>
      <path d="M12 3c.6 4 2.4 5.8 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.2 5.4-2 6-6Z" />
      <path d="M19 15c.25 1.7 1.05 2.5 2.5 2.75-1.45.25-2.25 1.05-2.5 2.5-.25-1.45-1.05-2.25-2.5-2.5 1.45-.25 2.25-1.05 2.5-2.75Z" />
    </>
  }
  if (name === 'list') {
    return <>
      <path d="M8 6h11M8 12h11M8 18h11" />
      <circle cx="4.5" cy="6" r=".8" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r=".8" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r=".8" fill="currentColor" stroke="none" />
    </>
  }
  if (name === 'cloud') {
    return <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6.2 6.2 0 0 0 6.4 9a4.8 4.8 0 0 0 .6 9.5Z" />
  }
  if (name === 'coffee' || name === 'meal') {
    return <>
      <path d="M5 8h11v6.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5V8Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4.5c0 1-1 1.3-1 2.3M12 4.5c0 1-1 1.3-1 2.3" />
    </>
  }
  if (name === 'shield' || name === 'status') {
    return <>
      <path d="M12 3 19 6v5.5c0 4.3-2.6 7.4-7 9.5-4.4-2.1-7-5.2-7-9.5V6l7-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  }
  if (name === 'minus-circle') {
    return <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12h8" />
    </>
  }
  if (name === 'document') {
    return <>
      <path d="M6 3.5h8l4 4V20H6Z" />
      <path d="M14 3.5V8h4M9 12h6M9 16h6" />
    </>
  }
  if (name === 'note') {
    return <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  }
  if (name === 'user') {
    return <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  }
  if (name === 'plus') return <path d="M12 5v14M5 12h14" />
  if (name === 'break') {
    return <>
      <path d="M6 8h9v6.5A4.5 4.5 0 0 1 10.5 19h0A4.5 4.5 0 0 1 6 14.5V8Z" />
      <path d="M15 10h1.5a2.5 2.5 0 0 1 0 5H15" />
    </>
  }
  if (name === 'journey') {
    return <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l4 2M6 4.5l1.5 2M18 4.5l-1.5 2" />
    </>
  }
  if (name === 'phone') {
    return <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M10 5h4M11 18.5h2" />
    </>
  }
  if (name === 'monitor') {
    return <>
      <rect x="3" y="4" width="18" height="13" rx="2.2" />
      <path d="M8 21h8M12 17v4" />
    </>
  }
  if (name === 'globe') {
    return <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5S14.3 18.1 12 20.5M12 3.5C9.7 5.9 8.5 8.7 8.5 12s1.2 6.1 3.5 8.5" />
    </>
  }
  return null
}

export function AppIcon({
  name,
  motion = 'none',
  className = '',
  ...props
}: AppIconProps) {
  const classes = [
    'appIcon',
    `appIcon--${name}`,
    motion !== 'none' ? `appIcon--motion-${motion}` : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={classes}
      {...props}
    >
      {iconContent(name)}
    </svg>
  )
}
