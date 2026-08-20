import type { NavigationIconName } from './NavigationIcon'

export interface NavigationItem {
  label: string
  path: string
  icon: NavigationIconName
  end?: boolean
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Hoje', path: '/', icon: 'home', end: true },
  { label: 'Atividades', path: '/atividades', icon: 'activities' },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Histórico', path: '/historico', icon: 'history' },
  { label: 'Mais', path: '/mais', icon: 'more' },
]

export const secondaryNavigation: NavigationItem[] = [
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]
