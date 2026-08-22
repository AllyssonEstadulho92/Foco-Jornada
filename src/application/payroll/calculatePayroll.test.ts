import { describe, expect, it } from 'vitest'
import { defaultPayrollConfig, type PayrollDayPlan } from '../../domain/payroll/Payroll'
import { calculateIrs2026, calculatePayroll } from './calculatePayroll'

function workDays(count: number): PayrollDayPlan[] {
  return Array.from({ length: count }, (_, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, '0')}`,
    kind: 'work' as const,
    overtimeHours: 0,
  }))
}

describe('calculatePayroll', () => {
  it('reproduz o exemplo de 920 € + 23 dias a 6 € - 11% SS', () => {
    const result = calculatePayroll(defaultPayrollConfig, workDays(23))

    expect(result.mealAllowanceGross).toBe(138)
    expect(result.socialSecurity).toBe(101.2)
    expect(result.irsTotal).toBe(0)
    expect(result.grossTotal).toBe(1058)
    expect(result.netEstimate).toBe(956.8)
  })

  it('permite reproduzir valores do recibo com ajustes manuais', () => {
    const result = calculatePayroll(
      {
        ...defaultPayrollConfig,
        mealDaysOverride: 23,
        absenceDeductionOverride: 0,
        overtimePayOverride: 0,
        socialSecurityOverride: 101.2,
        irsOverride: 0,
      },
      [{ date: '2026-08-03', kind: 'absence-unjustified', overtimeHours: 3 }],
    )

    expect(result.mealDays).toBe(23)
    expect(result.mealAllowanceGross).toBe(138)
    expect(result.absenceDeduction).toBe(0)
    expect(result.overtimePay).toBe(0)
    expect(result.socialSecurity).toBe(101.2)
    expect(result.irsTotal).toBe(0)
    expect(result.netEstimate).toBe(956.8)
  })

  it('aplica retenção zero até 920 € na tabela I de 2026', () => {
    expect(calculateIrs2026(920, 'table-1', 0)).toBe(0)
  })

  it('reproduz o exemplo AT de 960 € na tabela I de 2026', () => {
    expect(calculateIrs2026(960, 'table-1', 0)).toBe(18)
  })

  it('aplica a redução de um ponto percentual com três dependentes', () => {
    expect(calculateIrs2026(1500, 'table-1', 3)).toBe(88.88)
  })

  it('usa a fórmula legal completa do valor hora antes do arredondamento final', () => {
    const plans: PayrollDayPlan[] = [
      { date: '2026-08-03', kind: 'work', overtimeHours: 2 },
    ]
    const result = calculatePayroll(defaultPayrollConfig, plans)

    expect(result.hourlyRate).toBe(5.31)
    expect(result.overtimeHours).toBe(2)
    expect(result.overtimePay).toBe(13.93)
  })

  it('muda os acréscimos quando o acumulado anual ultrapassa 100 horas', () => {
    const plans: PayrollDayPlan[] = [
      { date: '2026-08-03', kind: 'work', overtimeHours: 2 },
    ]
    const result = calculatePayroll(
      { ...defaultPayrollConfig, overtimeHoursBeforeMonth: 100 },
      plans,
    )

    expect(result.overtimePay).toBe(17.25)
  })

  it('aplica 100% de acréscimo em descanso/feriado acima das 100 horas anuais', () => {
    const plans: PayrollDayPlan[] = [
      { date: '2026-08-09', kind: 'rest', overtimeHours: 2 },
    ]
    const result = calculatePayroll(
      { ...defaultPayrollConfig, overtimeHoursBeforeMonth: 100 },
      plans,
    )

    expect(result.overtimePay).toBe(21.23)
  })

  it('desconta uma falta integral pela duração diária contratual', () => {
    const plans: PayrollDayPlan[] = [
      { date: '2026-08-03', kind: 'absence-unjustified', overtimeHours: 0 },
    ]
    const result = calculatePayroll(defaultPayrollConfig, plans)

    expect(result.unpaidAbsenceHours).toBe(8)
    expect(result.absenceDeduction).toBe(42.46)
    expect(result.netEstimate).toBeLessThan(defaultPayrollConfig.baseSalary)
  })

  it('desconta ausência parcial ao minuto quando as horas são fornecidas', () => {
    const plans: PayrollDayPlan[] = [
      {
        date: '2026-08-03',
        kind: 'work',
        overtimeHours: 0,
        unpaidAbsenceHours: 3.5,
      },
    ]
    const result = calculatePayroll(defaultPayrollConfig, plans)

    expect(result.unpaidAbsenceHours).toBe(3.5)
    expect(result.absenceDeduction).toBe(18.58)
  })

  it('não duplica ausência integral quando existem horas exatas informadas', () => {
    const plans: PayrollDayPlan[] = [
      {
        date: '2026-08-03',
        kind: 'absence-unjustified',
        overtimeHours: 0,
        unpaidAbsenceHours: 4,
      },
    ]
    const result = calculatePayroll(defaultPayrollConfig, plans)

    expect(result.unpaidAbsenceHours).toBe(4)
    expect(result.absenceDeduction).toBe(21.23)
  })
})
