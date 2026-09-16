import { describe, expect, it } from 'vitest'
import plannerCss from './vacation-planner.css?raw'
import plannerPage from '../presentation/pages/VacationPlannerPanel.tsx?raw'
import vacationPage from '../presentation/pages/VacationBalancePage.tsx?raw'

describe('planeador de férias responsivo', () => {
  it('reutiliza dados da página e monta a simulação no mesmo ecrã', () => {
    expect(vacationPage).toContain('<VacationPlannerPanel')
    expect(vacationPage).toContain('recordedVacationDates={recordedVacationDates}')
    expect(vacationPage).toContain('settings={settings}')
    expect(plannerPage).toContain('simulateVacationPeriod({')
    expect(plannerPage).toContain('listUpcomingVacationPeriods(today, recordedVacationDates)')
  })

  it('contém inputs, cartões e texto e preserva a informação em mobile', () => {
    expect(plannerCss).toContain('.vacationPlannerPanel {')
    expect(plannerCss).toContain('overflow: hidden')
    expect(plannerCss).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr))')
    expect(plannerCss).toContain('.vacationPlannerForm input {')
    expect(plannerCss).toContain('max-width: 100%')
    expect(plannerCss).toContain('@media (max-width: 560px)')
    expect(plannerCss).toContain('grid-template-columns: minmax(0, 1fr)')
  })

  it('tem campos rotulados, resposta de estado e opção de registo explícito', () => {
    expect(plannerPage).toContain('aria-labelledby="vacation-planner-title"')
    expect(plannerPage).toContain('aria-live="polite"')
    expect(plannerPage).toContain('type="date"')
    expect(plannerPage).toContain('to="/turnos"')
    expect(plannerCss).toContain('focus-visible')
    expect(plannerCss).toContain('@media (forced-colors: active)')
    expect(plannerCss).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
