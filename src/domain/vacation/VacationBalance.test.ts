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

describe('calculateVacationBalance', () => {
  it('aplica o período anual mínimo e desconta apenas férias já gozadas no saldo atual', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      carriedDays: 2,
      recordedVacationDates: [
        '2026-08-24',
        '2026-08-25',
        '2026-08-26',
        '2026-10-02',
        '2026-10-05',
      ],
    })

    expect(result.entitlementDays).toBe(22)
    expect(result.recordedTakenDays).toBe(3)
    expect(result.recordedPlannedDays).toBe(2)
    expect(result.availableBalanceDays).toBe(21)
    expect(result.projectedBalanceDays).toBe(19)
  })

  it('conta 10 dias úteis entre 24 de agosto e 6 de setembro de 2026', () => {
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
      asOfDate: '2026-09-15',
      recordedVacationDates,
    })

    expect(result.recordedTakenDays).toBe(10)
    expect(result.recordedIgnoredWeekendDays).toBe(4)
    expect(result.takenDays).toBe(10)
  })

  it('não desconta sábado ou domingo quando estão marcados como férias', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      recordedVacationDates: ['2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07'],
    })

    expect(result.recordedTakenDays).toBe(2)
    expect(result.recordedIgnoredWeekendDays).toBe(2)
  })

  it('acumula a meta pessoal de 28 dias apenas por meses de calendário concluídos', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      recordedVacationDates: [],
    })

    expect(result.monthlyAccrualTargetDays).toBe(28)
    expect(result.monthlyAccrualPerMonth).toBe(2.33)
    expect(result.completedAccrualMonths).toBe(8)
    expect(result.monthlyAccruedDays).toBe(18.67)
    expect(result.monthlyAvailableBalanceDays).toBe(18.67)
  })

  it('fecha setembro em 21 dias acumulados e dezembro exatamente em 28', () => {
    const september = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-30',
      recordedVacationDates: [],
    })
    const december = calculateVacationBalance({
      ...base,
      asOfDate: '2026-12-31',
      recordedVacationDates: [],
    })

    expect(september.completedAccrualMonths).toBe(9)
    expect(september.monthlyAccruedDays).toBe(21)
    expect(december.completedAccrualMonths).toBe(12)
    expect(december.monthlyAccruedDays).toBe(28)
  })

  it('não credita janeiro antes do fim do mês e credita 2,33 dias no último dia', () => {
    const beforeClose = calculateVacationBalance({
      ...base,
      asOfDate: '2026-01-30',
      recordedVacationDates: [],
    })
    const monthClose = calculateVacationBalance({
      ...base,
      asOfDate: '2026-01-31',
      recordedVacationDates: [],
    })

    expect(beforeClose.completedAccrualMonths).toBe(0)
    expect(beforeClose.monthlyAccruedDays).toBe(0)
    expect(monthClose.completedAccrualMonths).toBe(1)
    expect(monthClose.monthlyAccruedDays).toBe(2.33)
  })

  it('gera os 12 marcos mensais sem erro de arredondamento acumulado', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      recordedVacationDates: [],
    })

    expect(result.monthlyAccrualSchedule.map((item) => item.cumulativeDays)).toEqual([
      2.33,
      4.67,
      7,
      9.33,
      11.67,
      14,
      16.33,
      18.67,
      21,
      23.33,
      25.67,
      28,
    ])
    expect(result.monthlyAccrualSchedule[7].completed).toBe(true)
    expect(result.monthlyAccrualSchedule[8].current).toBe(true)
    expect(result.monthlyAccrualSchedule[8].completed).toBe(false)
  })

  it('desconta férias já gozadas e futuras também no saldo de acumulação mensal', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      carriedDays: 1,
      adjustmentDays: 1,
      manualTakenDays: 1,
      recordedVacationDates: ['2026-08-24', '2026-10-02'],
    })

    expect(result.monthlyAccruedDays).toBe(18.67)
    expect(result.takenDays).toBe(2)
    expect(result.monthlyAvailableBalanceDays).toBe(18.67)
    expect(result.monthlyProjectedBalanceDays).toBe(17.67)
  })

  it('elimina datas duplicadas vindas de fontes diferentes', () => {
    const result = calculateVacationBalance({
      ...base,
      asOfDate: '2026-09-15',
      recordedVacationDates: ['2026-08-24', '2026-08-24', '2026-08-25'],
    })

    expect(result.recordedTakenDays).toBe(2)
  })

  it('no ano de admissão usa meses completos de contrato e limita a 20 dias', () => {
    const result = calculateVacationBalance({
      ...base,
      employmentStartDate: '2026-01-15',
      asOfDate: '2026-12-31',
      recordedVacationDates: [],
    })

    expect(result.isAdmissionYear).toBe(true)
    expect(result.completedContractMonths).toBe(11)
    expect(result.entitlementDays).toBe(20)
    expect(result.usesCompletedMonthPolicy).toBe(true)
  })

  it('antes de seis meses mostra dias adquiridos, mas não os apresenta como disponíveis para gozo', () => {
    const result = calculateVacationBalance({
      ...base,
      employmentStartDate: '2026-06-01',
      asOfDate: '2026-09-15',
      recordedVacationDates: [],
    })

    expect(result.entitlementDays).toBe(6)
    expect(result.entitlementUsableFromDate).toBe('2026-12-01')
    expect(result.canUseCurrentEntitlement).toBe(false)
  })

  it('num ano normal nunca aceita um período anual configurado abaixo de 22 dias', () => {
    const result = calculateVacationBalance({
      ...base,
      annualEntitlementDays: 18,
      asOfDate: '2026-09-15',
      recordedVacationDates: [],
    })

    expect(result.entitlementDays).toBe(22)
    expect(result.nextEntitlementDays).toBe(22)
  })

  it('aceita dias adicionais contratualmente confirmados acima do mínimo legal', () => {
    const result = calculateVacationBalance({
      ...base,
      annualEntitlementDays: 25,
      asOfDate: '2026-09-15',
      recordedVacationDates: [],
    })

    expect(result.entitlementDays).toBe(25)
    expect(result.nextEntitlementDays).toBe(25)
  })

  it('não cria direito anual quando a data de admissão ainda está no futuro', () => {
    const result = calculateVacationBalance({
      ...base,
      employmentStartDate: '2026-10-01',
      asOfDate: '2026-09-15',
      recordedVacationDates: [],
    })

    expect(result.entitlementDays).toBe(0)
    expect(result.canUseCurrentEntitlement).toBe(false)
  })
})
