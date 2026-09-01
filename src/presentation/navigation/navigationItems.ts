import type { NavigationIconName } from './NavigationIcon'

export interface NavigationItem {
  label: string
  path: string
  icon: NavigationIconName
  end?: boolean
}

// Navegação principal 1.2: apenas áreas de uso frequente.
// As ferramentas operacionais e administrativas continuam acessíveis em “Mais”.
export const primaryNavigation: NavigationItem[] = [
  { label: 'Início', path: '/', icon: 'home', end: true },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Calendário', path: '/calendario', icon: 'activities' },
  { label: 'Notificações', path: '/notificacoes', icon: 'history' },
  { label: 'Relatórios', path: '/relatorios', icon: 'stats' },
  { label: 'Mais', path: '/mais', icon: 'more' },
]

export const secondaryNavigation: NavigationItem[] = [
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]
