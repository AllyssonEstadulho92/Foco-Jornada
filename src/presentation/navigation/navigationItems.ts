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

// Fonte única de configuração da navegação.
// O AppShell apenas apresenta estas coleções; não redefine rotas ou rótulos localmente.
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

export const mobileQuickNavigation: QuickNavigationItem[] = [
  { label: 'Mapa de turnos', path: '/turnos', icon: 'activities', description: 'Ver e editar turnos' },
  { label: 'Medicação', path: '/medicamentos', icon: 'more', description: 'Horários, tomas e stock' },
  { label: 'Stock pessoal', path: '/stock', icon: 'more', description: 'Gerir stock pessoal' },
  { label: 'Horas', path: '/horas', icon: 'hours', description: 'Calcular e consultar' },
  { label: 'Vencimento', path: '/vencimento', icon: 'payroll', description: 'Simular e consultar' },
]

export const mobileMainNavigation: NavigationItem[] = [
  { label: 'Início', path: '/', icon: 'home', end: true },
  { label: 'Calendário', path: '/calendario', icon: 'activities' },
  { label: 'Notificações', path: '/notificacoes', icon: 'history' },
  { label: 'Relatórios', path: '/relatorios', icon: 'stats' },
  { label: 'Atividades', path: '/atividades', icon: 'activities' },
  { label: 'Histórico', path: '/historico', icon: 'history' },
  { label: 'Guia', path: '/guia', icon: 'guide' },
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]

export const mobileDataNavigation: NavigationItem[] = [
  { label: 'Estado da aplicação', path: '/mais', icon: 'focus' },
  { label: 'Estatísticas detalhadas', path: '/estatisticas', icon: 'stats' },
  { label: 'Exportar dados', path: '/exportar', icon: 'export' },
  { label: 'Cópia de segurança', path: '/mais', icon: 'more' },
]

export const mobileBottomNavigation: NavigationItem[] = [
  { label: 'Início', path: '/', icon: 'home', end: true },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Calendário', path: '/calendario', icon: 'activities' },
  { label: 'Relatórios', path: '/relatorios', icon: 'stats' },
]
