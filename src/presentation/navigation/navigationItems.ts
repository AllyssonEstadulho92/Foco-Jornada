export interface NavigationItem {
  label: string
  path: string
  mark: string
  end?: boolean
}

export const primaryNavigation: NavigationItem[] = [
  { label: 'Hoje', path: '/', mark: 'H', end: true },
  { label: 'Atividades', path: '/atividades', mark: 'A' },
  { label: 'Foco', path: '/foco', mark: 'F' },
  { label: 'Histórico', path: '/historico', mark: 'R' },
  { label: 'Mais', path: '/mais', mark: 'M' },
]

export const secondaryNavigation: NavigationItem[] = [
  { label: 'Definições', path: '/definicoes', mark: 'D' },
]
