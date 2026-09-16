import { describe, expect, it } from 'vitest'
import { suggestVacationPeriods } from './VacationSuggestions'

const taken = [
  '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28',
  '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
]
const base = {
  asOfDate: '2026-09-16',
  asOfDayProgress: 0.5,
  employmentStartDate: '2024-06-01',
  annualEntitlementDays: 22,
  monthlyAccrualTargetDays: 28,
  carriedDays: 0,
  manualTakenDays: 0,
  adjustmentDays: 0,
  recordedVacationDates: taken,
  requestedDays: 10,
  excludedMonth: 0,
  preference: 'rest' as const,
}

describe('suggestVacationPeriods', () => {
  it('sugere intervalos reais de 2026 sem inventar datas ou consumir mais que os 10 dias pedidos', () => {
    const options = suggestVacationPeriods(base)
    expect(options.length).toBeGreaterThan(0)
    expect(options.every((item) => item.workingDays === 10)).toBe(true)
    expect(options.every((item) => item.startDate > base.asOfDate && item.endDate <= '2026-12-31')).toBe(true)
    expect(options.every((item) => item.afterYearEndBalanceDays === 8)).toBe(true)
    expect(options.every((item) => item.afterPeriodBalanceDays >= 0)).toBe(true)
    expect(new Set(options.map((item) => item.month)).size).toBe(options.length)
    expect(options[0].restDays).toBeGreaterThanOrEqual(options[0].calendarDays)
  })

  it('não propõe sobreposição de dias já marcados nem atravessa o mês a evitar', () => {
    const booked = [...taken, '2026-09-21', '2026-10-01', '2026-10-01']
    const options = suggestVacationPeriods({ ...base, recordedVacationDates: booked, excludedMonth: 10 })
    expect(options.length).toBeGreaterThan(0)
    expect(options.every((item) => item.month !== 10 && !item.startDate.startsWith('2026-10'))).toBe(true)
    expect(options.every((item) => !(item.startDate <= '2026-09-21' && item.endDate >= '2026-09-21'))).toBe(true)
    expect(options.every((item) => !(item.startDate <= '2026-10-01' && item.endDate >= '2026-10-01'))).toBe(true)
  })

  it('respeita o critério mais cedo sem o confundir com melhor oportunidade objetiva', () => {
    const options = suggestVacationPeriods({ ...base, preference: 'soon' })
    expect(options.length).toBeGreaterThan(0)
    for (let index = 1; index < options.length; index += 1) {
      expect(options[index - 1].startDate <= options[index].startDate).toBe(true)
    }
  })

  it('ordena por saldo projetado no fim quando esse é o critério escolhido', () => {
    const options = suggestVacationPeriods({ ...base, preference: 'balance' })
    expect(options.length).toBeGreaterThan(0)
    for (let index = 1; index < options.length; index += 1) {
      expect(options[index - 1].afterPeriodBalanceDays >= options[index].afterPeriodBalanceDays).toBe(true)
    }
  })

  it('não devolve sugestões com saldo pessoal negativo e não altera os registos de entrada', () => {
    const recorded = [...taken]
    expect(suggestVacationPeriods({ ...base, requestedDays: 30 })).toEqual([])
    expect(recorded).toEqual(taken)
    expect(suggestVacationPeriods({ ...base, recordedVacationDates: recorded }).length).toBeGreaterThan(0)
    expect(recorded).toEqual(taken)
  })

  it('valida números e encerra as sugestões na passagem de ano', () => {
    expect(suggestVacationPeriods({ ...base, requestedDays: 0 })).toEqual([])
    expect(suggestVacationPeriods({ ...base, requestedDays: 2.5 })).toEqual([])
    expect(suggestVacationPeriods({ ...base, asOfDate: '2026-12-31' })).toEqual([])
  })
})
