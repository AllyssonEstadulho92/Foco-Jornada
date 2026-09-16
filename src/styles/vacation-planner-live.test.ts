import { describe, expect, it } from 'vitest'
import liveCss from './vacation-planner-live.css?raw'
import plannerPage from '../presentation/pages/VacationPlannerPanel.tsx?raw'
import balancePage from '../presentation/pages/VacationBalancePage.tsx?raw'

describe('planeamento de férias — resumo vivo', () => {
  it('usa o mesmo relógio e as mesmas datas do cálculo existente', () => {
    expect(plannerPage).toContain('clockLabel(asOfDayProgress)')
    expect(plannerPage).toContain('calculateVacationBalance({')
    expect(plannerPage).toContain('asOfDate: today,')
    expect(plannerPage).toContain('recordedVacationDates,')
    expect(plannerPage).toContain('monthlyLiveAccruedDays')
    expect(plannerPage).toContain('monthlyLiveAvailableBalanceDays')
    expect(plannerPage).toContain('monthlyLiveProjectedBalanceDays')
    expect(plannerPage).toContain('yearEndProjectedBalanceDays')
    expect(plannerPage).not.toContain('setInterval(')
    expect(balancePage).toContain('window.setInterval(refreshNow, 60_000)')
    expect(balancePage).toContain("window.addEventListener('focus', refreshNow)")
    expect(balancePage).toContain("document.addEventListener('visibilitychange', handleVisibility)")
  })

  it('separa projeção pessoal de novas simulações e mantém estados legíveis', () => {
    expect(plannerPage).toContain('sem incluir a simulação abaixo')
    expect(plannerPage).toContain('vacationPlannerLiveNegative')
    expect(plannerPage).toContain('<time dateTime={`${today}T${updatedTime}`}>')
    expect(plannerPage).toContain('A simulação não reserva nem regista férias.')
    expect(liveCss).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr))')
    expect(liveCss).toContain('overflow-wrap: anywhere')
    expect(liveCss).toContain('@media (max-width: 440px)')
    expect(liveCss).toContain('@media (forced-colors: active)')
    expect(liveCss).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
