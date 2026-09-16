import { describe, expect, it } from 'vitest'
import vacationInsightsCss from './vacation-insights.css?raw'

describe('painel de indicadores avançados de férias', () => {
  it('usa grelha fluida e mantém cartões contidos', () => {
    expect(vacationInsightsCss).toContain('.vacationInsightsGrid')
    expect(vacationInsightsCss).toContain('repeat(auto-fit, minmax(min(100%, 14rem), 1fr))')
    expect(vacationInsightsCss).toContain('.vacationInsightCard')
    expect(vacationInsightsCss).toContain('overflow: hidden')
    expect(vacationInsightsCss).toContain('max-width: 100%')
  })

  it('protege barra de progresso e reduz movimento quando pedido', () => {
    expect(vacationInsightsCss).toContain('.vacationAnnualProgressTrack')
    expect(vacationInsightsCss).toContain('max-width: 100%')
    expect(vacationInsightsCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(vacationInsightsCss).toContain('transition: none')
  })

  it('passa os indicadores para uma coluna em ecrãs estreitos e suporta forced colors', () => {
    expect(vacationInsightsCss).toContain('@media (max-width: 560px)')
    expect(vacationInsightsCss).toContain('grid-template-columns: 1fr')
    expect(vacationInsightsCss).toContain('@media (forced-colors: active)')
  })
})
