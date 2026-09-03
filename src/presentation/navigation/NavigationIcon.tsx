import { GloLogo } from '../components/brand/GloLogo'
import { AppIcon, type AppIconName } from '../components/ui/AppIcon'

export type NavigationIconName =
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
  | 'medication'
  | 'status'
  | 'list'
  | 'shield'
  | 'calendar'
  | 'journey'
  | 'glo'

export function NavigationIcon({ name }: { name: NavigationIconName }) {
  if (name === 'glo') return <GloLogo />
  return <AppIcon name={name as AppIconName} />
}

export function BrandIcon() {
  return <AppIcon name="check" />
}
