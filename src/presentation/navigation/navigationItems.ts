import type { NavigationIconName } from './NavigationIcon'

export interface NavigationItem {
  label: string
  path: string
  icon: NavigationIconName
  end?: boolean
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Hoje', path: '/', icon: 'home', end: true },
  { label: 'Mapa de turnos', path: '/turnos', icon: 'activities' },
  { label: 'Atividades', path: '/atividades', icon: 'activities' },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Histórico', path: '/historico', icon: 'history' },
  { label: 'Stock pessoal', path: '/stock', icon: 'more' },
  { label: 'Mais', path: '/mais', icon: 'more' },
]

export const secondaryNavigation: NavigationItem[] = [
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]
