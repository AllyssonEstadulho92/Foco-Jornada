import { describe, expect, it } from 'vitest'
import planner from '../presentation/pages/VacationPlannerPanel.tsx?raw'
import joint from '../presentation/pages/VacationJointPlanner.tsx?raw'
import css from './vacation-joint-planner.css?raw'
import yearCss from './vacation-planning-year.css?raw'

describe('planeamento a dois e hierarquia responsiva', () => {
  it('mostra dois anos sem reutilizar o saldo atual como saldo do próximo ano', () => {
    expect(planner).toContain('Ano de planeamento')
    expect(planner).toContain('Próximo ano · {currentYear + 1}')
    expect(planner).toContain('<VacationJointPlanner')
    expect(planner).toContain('O teu saldo neste momento · {currentYear}')
    expect(planner).toContain('<VacationSuggestionsPanel')
    expect(planner).toContain('Pré-visualização · sem guardar')
  })

  it('impede novembro/dezembro, mantém confirmações separadas e não cria gravações implícitas', () => {
    expect(joint).toContain('BLOCKED_MONTHS = [11, 12] as const')
    expect(joint).toContain('disabled={BLOCKED_MONTHS.includes(value as 11 | 12)}')
    expect(joint).toContain('Já confirmei as datas com a minha parceira.')
    expect(joint).toContain('Já recebi confirmação da entidade empregadora.')
    expect(joint).toContain('Não é enviado qualquer pedido à empresa.')
    expect(joint).not.toContain('setItem(')
    expect(joint).not.toContain('setInterval(')
    expect(joint).toContain('aria-pressed={active}')
    expect(joint).toContain('aria-expanded={showCalendar}')
  })

  it('contém cartões, filtros e calendário no telemóvel e no computador', () => {
    expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr))')
    expect(css).toContain('grid-template-columns: repeat(7, minmax(0, 1fr))')
    expect(css).toContain('overflow-wrap: anywhere')
    expect(css).toContain('@media (max-width: 640px)')
    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(yearCss).toContain('.vacationPlanningYearSwitch button.isSelected')
    expect(yearCss).toContain('grid-template-columns: minmax(0, 1fr)')
  })
})
