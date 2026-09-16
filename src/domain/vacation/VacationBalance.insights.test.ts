import { describe, expect, it } from 'vitest'
import { calculateVacationBalance } from './VacationBalance'

const base = {
  employmentStartDate: '2024-06-01',
  annualEntitlementDays: 22,
  monthlyAccrualTargetDays: 28,
  carriedDays: 0,
  manualTakenDays: 0,
  adjustmentDays: 0,
}

describe('indicadores avançados de férias', () => {
  it('mostra progresso anual, restante e próximo marco de acumulação', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      asOfDayProgress: 0.5,
      recordedVacationDates: [],
    })

    expect(result.monthlyLiveAccruedDays).toBe(19.7944)
    expect(result.annualAccrualProgressPercent).toBe(70.69)
    expect(result.annualAccrualRemainingDays).toBe(8.2056)
    expect(result.nextAccrualMilestoneDays).toBe(20)
    expect(result.nextAccrualMilestoneDate).toBe('2026-09-18')
    expect(result.hasReachedAccrualTarget).toBe(false)
  })

  it('projeta o saldo no fim do ano depois de férias gozadas e planeadas', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      asOfDayProgress: 0.5,
      carriedDays: 1,
      adjustmentDays: 1,
      manualTakenDays: 1,
      recordedVacationDates: ['2026-08-24', '2026-10-02'],
    })

    expect(result.takenDays).toBe(2)
    expect(result.recordedPlannedDays).toBe(1)
    expect(result.usedAndPlannedDays).toBe(3)
    expect(result.usedAndPlannedPercentOfTarget).toBe(10.71)
    expect(result.yearEndProjectedBalanceDays).toBe(27)
  })

  it('projeta 18 dias no fim do ano depois dos 10 dias úteis de 24/08 a 06/09', () => {
    const recordedVacationDates = [
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-16',
      recordedVacationDates,
    })

    expect(result.recordedTakenDays).toBe(10)
    expect(result.recordedIgnoredWeekendDays).toBe(4)
    expect(result.usedAndPlannedDays).toBe(10)
    expect(result.yearEndProjectedBalanceDays).toBe(18)
  })

  it('encerra o próximo marco quando a meta anual já foi atingida', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-12-31',
      asOfDayProgress: 1,
      recordedVacationDates: [],
    })

    expect(result.monthlyLiveAccruedDays).toBe(28)
    expect(result.annualAccrualProgressPercent).toBe(100)
    expect(result.annualAccrualRemainingDays).toBe(0)
    expect(result.nextAccrualMilestoneDays).toBeNull()
    expect(result.nextAccrualMilestoneDate).toBeNull()
    expect(result.hasReachedAccrualTarget).toBe(true)
  })
})
