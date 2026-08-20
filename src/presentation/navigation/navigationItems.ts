import type { NavigationIconName } from '../components/NavigationIcon'

export interface NavigationItem {
  label: string
  path: string
  icon: NavigationIconName
  end?: boolean
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Hoje', path: '/', icon: 'home', end: true },
  { label: 'Atividades', path: '/atividades', icon: 'tasks' },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Histórico', path: '/historico', icon: 'history' },
  { label: 'Mais', path: '/mais', icon: 'more' },
]

export const secondaryNavigation: NavigationItem[] = [
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]
