import { describe, expect, it } from 'vitest'
import { suggestJointVacationPeriods } from './VacationJointPlanning'

const settings = {
  employmentStartDate: '2024-06-01',
  annualEntitlementDays: 22,
  monthlyAccrualTargetDays: 28,
  carriedDays: 9,
  manualTakenDays: 3,
  adjustmentDays: 2,
}
const base = {
  today: '2026-09-17',
  year: 2027,
  month: 7,
  requestedDays: 10,
  excludedMonths: [11, 12],
  recordedVacationDates: [] as string[],
  settings,
}

describe('suggestJointVacationPeriods', () => {
  it('propõe quinzenas verificáveis de julho de 2027, sem criar direito adquirido', () => {
    const options = suggestJointVacationPeriods(base)
    expect(options.slice(0, 3).map((option) => [option.startDate, option.endDate])).toEqual([
      ['2027-07-05', '2027-07-16'],
      ['2027-07-12', '2027-07-23'],
      ['2027-07-19', '2027-07-30'],
    ])
    expect(options.every((option) => option.workingDays === 10 && option.restDays === 16)).toBe(true)
    expect(options.every((option) => option.afterYearEndBalanceDays === 18)).toBe(true)
    expect(options.every((option) => option.afterPeriodBalanceDays >= 0)).toBe(true)
    expect(base.settings.carriedDays).toBe(9)
  })

  it('exclui novembro e dezembro inclusive quando o intervalo atravessaria os meses', () => {
    expect(suggestJointVacationPeriods({ ...base, month: 11 })).toEqual([])
    expect(suggestJointVacationPeriods({ ...base, month: 12 })).toEqual([])
    const october = suggestJointVacationPeriods({ ...base, month: 10, requestedDays: 10 })
    expect(october.every((option) => option.endDate < '2027-11-01')).toBe(true)
  })

  it('não propõe um dia útil já marcado nem duplica o saldo', () => {
    const options = suggestJointVacationPeriods({
      ...base,
      recordedVacationDates: ['2027-07-12', '2027-07-12'],
    })
    expect(options.every((option) => !(option.startDate <= '2027-07-12' && option.endDate >= '2027-07-12'))).toBe(true)
    expect(options.every((option) => option.alreadyRecordedDays === 0)).toBe(true)
  })

  it('não propõe intervalos passados, anos arbitrários ou dias inválidos', () => {
    expect(suggestJointVacationPeriods({ ...base, year: 2028 })).toEqual([])
    expect(suggestJointVacationPeriods({ ...base, requestedDays: 0 })).toEqual([])
    expect(suggestJointVacationPeriods({ ...base, requestedDays: 3.5 })).toEqual([])
    expect(suggestJointVacationPeriods({ ...base, today: '2027-08-01', year: 2027 })).toEqual([])
    expect(suggestJointVacationPeriods({ ...base, today: '2026-02-30' })).toEqual([])
  })
})
