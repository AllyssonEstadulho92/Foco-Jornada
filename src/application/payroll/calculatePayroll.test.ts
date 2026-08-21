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

  it('aplica retenção zero até 920 € na tabela I de 2026', () => {
    expect(calculateIrs2026(920, 'table-1', 0)).toBe(0)
  })

  it('calcula trabalho suplementar em dia útil', () => {
    const plans: PayrollDayPlan[] = [
      { date: '2026-08-03', kind: 'work', overtimeHours: 2 },
    ]
    const result = calculatePayroll(defaultPayrollConfig, plans)

    expect(result.overtimeHours).toBe(2)
    expect(result.overtimePay).toBeGreaterThan(result.hourlyRate * 2)
  })

  it('desconta faltas não remuneradas', () => {
    const plans: PayrollDayPlan[] = [
      { date: '2026-08-03', kind: 'absence-unjustified', overtimeHours: 0 },
    ]
    const result = calculatePayroll(defaultPayrollConfig, plans)

    expect(result.absenceDeduction).toBeGreaterThan(0)
    expect(result.netEstimate).toBeLessThan(defaultPayrollConfig.baseSalary)
  })
})
