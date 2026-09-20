import { describe, expect, it } from 'vitest'
import layout from './vacation-prototype.css?raw'
import monthCss from './vacation-month-visual.css?raw'
import coastSvg from '../assets/vacation-coast.svg?raw'
import workspace from '../presentation/pages/VacationWorkspacePage.tsx?raw'
import balance from '../presentation/pages/VacationBalancePage.tsx?raw'
import visualization from '../presentation/pages/VacationMonthlyVisualization.tsx?raw'
import jointPlanner from '../presentation/pages/VacationJointPlanner.tsx?raw'

describe('adaptação fiel do protótipo aos dados reais', () => {
  it('preserva duas rotas e imagem vetorial local sem pessoas ou números inventados', () => {
    expect(workspace).toContain("import '../../styles/vacation-prototype.css'")
    expect(workspace).toContain("import '../../styles/vacation-month-visual.css'")
    expect(workspace).toContain('<NavLink to="/ferias" end')
    expect(workspace).toContain('<NavLink to="/ferias/planeamento"')
    expect(layout).toContain("url('../assets/vacation-coast.svg')")
    expect(coastSvg).toContain('<svg')
    expect(coastSvg).toContain('<title id="title">Paisagem costeira</title>')
    expect(coastSvg).not.toContain('http://www.w3.org/1999/xhtml')
  })

  it('o gráfico e a tabela consomem o mesmo cronograma e preservam os detalhes mensais', () => {
    expect(balance).toContain('schedule={balance.monthlyAccrualSchedule}')
    expect(balance).toContain('targetDays={balance.monthlyAccrualTargetDays}')
    expect(balance).toContain('<details className="vacationMonthDetails">')
    expect(balance).toContain('Ver detalhes e progresso dos 12 meses')
    expect(visualization).toContain("useState<'chart' | 'table'>('chart')")
    expect(visualization).toContain('aria-pressed={mode ===')
    expect(visualization).not.toContain('secureStorage')
    expect(visualization).not.toContain('setItem(')
  })

  it('mantém acessibilidade, regras móveis e simulação sem submissão falsa', () => {
    expect(layout).toContain('@media (max-width: 680px)')
    expect(layout).toContain('@media (max-width: 420px)')
    expect(layout).toContain('@media (forced-colors: active)')
    expect(layout).toContain('@media (prefers-reduced-motion: reduce)')
    expect(monthCss).toContain('min-width: 0')
    expect(monthCss).toContain('overflow-x: auto')
    expect(monthCss).toContain('button:focus-visible')
    expect(jointPlanner).toContain('Feriados, escala efetiva, disponibilidade da parceira e aprovação da ILUNION não são verificados')
    expect(jointPlanner).not.toContain('Submeter pedido de férias')
  })
})
