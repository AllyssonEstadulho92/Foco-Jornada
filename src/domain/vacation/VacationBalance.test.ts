import { describe, expect, it } from 'vitest'
import { calculateVacationBalance } from './VacationBalance'

const base = {
  employmentStartDate: '2024-06-01',
  annualEntitlementDays: 22,
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
        '2026-10-03',
      ],
    })

    expect(result.entitlementDays).toBe(22)
    expect(result.recordedTakenDays).toBe(3)
    expect(result.recordedPlannedDays).toBe(2)
    expect(result.availableBalanceDays).toBe(21)
    expect(result.projectedBalanceDays).toBe(19)
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
