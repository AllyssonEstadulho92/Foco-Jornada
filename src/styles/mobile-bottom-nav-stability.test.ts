import { describe, expect, it } from 'vitest'
import stabilityCss from './mobile-bottom-nav-stability.css?raw'

describe('estabilidade da navegação móvel', () => {
  it('mantém o painel Mais dentro do viewport', () => {
    expect(stabilityCss).toContain('.mobileQuickPanel {')
    expect(stabilityCss).toContain('left: max(8px, env(safe-area-inset-left)) !important')
    expect(stabilityCss).toContain('right: max(8px, env(safe-area-inset-right)) !important')
    expect(stabilityCss).toContain('width: auto !important')
    expect(stabilityCss).toContain('max-width: none !important')
    expect(stabilityCss).toContain('transform: none !important')
  })

  it('mantém os atalhos compactos e legíveis no painel', () => {
    expect(stabilityCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr)) !important')
    expect(stabilityCss).toContain('flex-direction: row !important')
    expect(stabilityCss).toContain('justify-content: flex-start !important')
    expect(stabilityCss).toContain('grid-column: 1 / -1 !important')
  })
})
