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

export function NavigationIcon({ name }: { name: NavigationIconName }) {
  return <AppIcon name={name as AppIconName} />
}

export function BrandIcon() {
  return <AppIcon name="check" />
}
