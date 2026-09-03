import { describe, expect, it } from 'vitest'
import {
  mobileBottomNavigation,
  mobileQuickNavigation,
  primaryNavigation,
  secondaryNavigation,
} from './navigationItems'

describe('arquitetura de navegação', () => {
  it('mantém cinco destinos primários consistentes no mobile', () => {
    expect(mobileBottomNavigation.map((item) => item.label)).toEqual([
      'Início',
      'Jornada',
      'Foco',
      'Notificações',
      'Mais',
    ])
    expect(new Set(mobileBottomNavigation.map((item) => item.path)).size).toBe(5)
  })

  it('mantém Medicação e glo acessíveis sem sobrecarregar a barra inferior', () => {
    expect(secondaryNavigation.some((item) => item.path === '/medicamentos')).toBe(true)
    expect(secondaryNavigation.some((item) => item.path === '/sticks')).toBe(true)
    expect(mobileQuickNavigation.some((item) => item.path === '/medicamentos')).toBe(true)
    expect(mobileQuickNavigation.some((item) => item.path === '/sticks')).toBe(true)
  })

  it('usa a mesma arquitetura principal no desktop e mobile', () => {
    expect(primaryNavigation.map((item) => item.path)).toEqual(
      mobileBottomNavigation.map((item) => item.path),
    )
  })
})
