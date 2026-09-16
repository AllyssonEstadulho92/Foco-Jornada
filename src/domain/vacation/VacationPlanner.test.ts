import { describe, expect, it } from 'vitest'
import { listUpcomingVacationPeriods, simulateVacationPeriod } from './VacationPlanner'

const base = {
  asOfDate: '2026-08-01',
  asOfDayProgress: 0.5,
  employmentStartDate: '2024-06-01',
  annualEntitlementDays: 22,
  monthlyAccrualTargetDays: 28,
  carriedDays: 0,
  manualTakenDays: 0,
  adjustmentDays: 0,
  recordedVacationDates: [] as string[],
}

describe('simulateVacationPeriod', () => {
  it('conta 10 dias úteis e quatro fins de semana entre 24/08 e 06/09 de 2026', () => {
    const result = simulateVacationPeriod({ ...base, startDate: '2026-08-24', endDate: '2026-09-06' })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.calendarDays).toBe(14)
    expect(result.workingDays).toBe(10)
    expect(result.weekendDays).toBe(4)
    expect(result.additionalDays).toBe(10)
    expect(result.afterYearEndBalanceDays).toBe(18)
  })

  it('não desconta duas vezes os dias já registados, mesmo duplicados na fonte', () => {
    const result = simulateVacationPeriod({
      ...base,
      asOfDate: '2026-09-16',
      startDate: '2026-09-18',
      endDate: '2026-09-28',
      recordedVacationDates: ['2026-09-21', '2026-09-21', '2026-09-24', '2026-09-30'],
    })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.calendarDays).toBe(11)
    expect(result.workingDays).toBe(7)
    expect(result.weekendDays).toBe(4)
    expect(result.alreadyRecordedDays).toBe(2)
    expect(result.additionalDays).toBe(5)
    expect(result.beforeYearEndBalanceDays).toBe(25)
    expect(result.afterYearEndBalanceDays).toBe(20)
    expect(result.beforePeriodBalanceDays).toBeCloseTo(19.9889, 4)
    expect(result.afterPeriodBalanceDays).toBeCloseTo(13.8444, 4)
  })

  it('não altera a projeção quando todos os dias úteis do intervalo já constam dos registos', () => {
    const result = simulateVacationPeriod({
      ...base,
      asOfDate: '2026-09-16',
      startDate: '2026-09-18',
      endDate: '2026-09-21',
      recordedVacationDates: ['2026-09-18', '2026-09-21'],
    })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.workingDays).toBe(2)
    expect(result.weekendDays).toBe(2)
    expect(result.alreadyRecordedDays).toBe(2)
    expect(result.additionalDays).toBe(0)
    expect(result.beforeYearEndBalanceDays).toBe(result.afterYearEndBalanceDays)
  })

  it('bloqueia datas inválidas, passadas, invertidas ou fora do ano atual', () => {
    const cases = [
      ['2026-09-31', '2026-10-01'],
      ['2026-08-01', '2026-08-02'],
      ['2026-10-10', '2026-10-09'],
      ['2026-12-31', '2027-01-02'],
    ]
    for (const [startDate, endDate] of cases) {
      expect(simulateVacationPeriod({ ...base, startDate, endDate }).valid).toBe(false)
    }
  })

  it('não desconta férias simuladas que caiam apenas num fim de semana', () => {
    const result = simulateVacationPeriod({
      ...base,
      asOfDate: '2026-09-16',
      startDate: '2026-09-19',
      endDate: '2026-09-20',
    })
    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.workingDays).toBe(0)
    expect(result.additionalDays).toBe(0)
    expect(result.beforeYearEndBalanceDays).toBe(result.afterYearEndBalanceDays)
  })
})

describe('listUpcomingVacationPeriods', () => {
  it('agrupa sexta e segunda sem incluir os fins de semana na contagem', () => {
    expect(listUpcomingVacationPeriods('2026-09-16', [
      '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21',
      '2026-09-21', '2026-09-23', '2026-09-16', '2027-01-04', '2026-09-31',
    ])).toEqual([
      { startDate: '2026-09-18', endDate: '2026-09-21', workingDays: 2 },
      { startDate: '2026-09-23', endDate: '2026-09-23', workingDays: 1 },
    ])
  })
})
