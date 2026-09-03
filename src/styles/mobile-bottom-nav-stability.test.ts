import { describe, expect, it } from 'vitest'
import stabilityCss from './mobile-bottom-nav-stability.css?raw'

describe('estabilidade da navegação móvel', () => {
  it('mantém cinco destinos com a mesma geometria', () => {
    expect(stabilityCss).toContain('grid-template-columns: repeat(5, minmax(0, 1fr)) !important')
    expect(stabilityCss).toContain('.mobileBottomBar .navLink {')
    expect(stabilityCss).toContain('min-height: 56px !important')
    expect(stabilityCss).not.toContain('.mobileQuickButton')
    expect(stabilityCss).not.toContain('.mobileQuickPanel')
  })

  it('mantém ícones e rótulos legíveis sem botão flutuante', () => {
    expect(stabilityCss).toContain('width: 23px !important')
    expect(stabilityCss).toContain('font-size: 11px !important')
    expect(stabilityCss).toContain('.mobileBottomBar .navLinkActive::before')
  })
})
