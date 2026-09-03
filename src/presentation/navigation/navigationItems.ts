import type { NavigationIconName } from './NavigationIcon'

export interface NavigationItem {
  label: string
  path: string
  icon: NavigationIconName
  end?: boolean
}

export interface QuickNavigationItem extends NavigationItem {
  description: string
}

// Fonte única da arquitetura de navegação.
// Mobile e desktop partilham os mesmos nomes funcionais para evitar duplicações e ambiguidades.
export const primaryNavigation: NavigationItem[] = [
  { label: 'Início', path: '/', icon: 'home', end: true },
  { label: 'Jornada', path: '/calendario', icon: 'journey' },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Notificações', path: '/notificacoes', icon: 'bell' },
  { label: 'Mais', path: '/mais', icon: 'more' },
]

export const secondaryNavigation: NavigationItem[] = [
  { label: 'Medicação', path: '/medicamentos', icon: 'medication' },
  { label: 'glo', path: '/sticks', icon: 'status' },
  { label: 'Relatórios', path: '/relatorios', icon: 'stats' },
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]

export const mobileQuickNavigation: QuickNavigationItem[] = [
  { label: 'Medicação', path: '/medicamentos', icon: 'medication', description: 'Tomas, horários e stock' },
  { label: 'glo', path: '/sticks', icon: 'status', description: 'Sessões, ritmo e stock' },
  { label: 'Mapa de turnos', path: '/turnos', icon: 'calendar', description: 'Ver e editar turnos' },
  { label: 'Stock pessoal', path: '/stock', icon: 'list', description: 'Gerir stock pessoal' },
  { label: 'Horas', path: '/horas', icon: 'hours', description: 'Calcular e consultar' },
  { label: 'Vencimento', path: '/vencimento', icon: 'payroll', description: 'Simular e consultar' },
]

export const mobileMainNavigation: NavigationItem[] = [
  { label: 'Atividades', path: '/atividades', icon: 'activities' },
  { label: 'Histórico', path: '/historico', icon: 'history' },
  { label: 'Relatórios', path: '/relatorios', icon: 'stats' },
  { label: 'Estatísticas', path: '/estatisticas', icon: 'stats' },
  { label: 'Guia', path: '/guia', icon: 'guide' },
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]

export const mobileDataNavigation: NavigationItem[] = [
  { label: 'Exportar dados', path: '/exportar', icon: 'export' },
  { label: 'Estado e segurança', path: '/mais', icon: 'shield' },
]

export const mobileBottomNavigation: NavigationItem[] = [
  { label: 'Início', path: '/', icon: 'home', end: true },
  { label: 'Jornada', path: '/calendario', icon: 'journey' },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Notificações', path: '/notificacoes', icon: 'bell' },
  { label: 'Mais', path: '/mais', icon: 'more' },
]
