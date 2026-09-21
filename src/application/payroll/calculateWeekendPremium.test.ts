import { describe, expect, it } from 'vitest'
import { defaultPayrollConfig, type PayrollDayPlan } from '../../domain/payroll/Payroll'
import { calculatePayroll } from './calculatePayroll'
import { calculateWeekendPremium } from './calculateWeekendPremium'

const saturday = { date: '2026-09-19', kind: 'work' as const, overtimeHours: 0 }
const sunday = { date: '2026-09-20', kind: 'work' as const, overtimeHours: 0 }

describe('acréscimos de fim de semana', () => {
  it('não inventa percentagens: conta as horas mas deixa o abono a zero até configurar', () => {
    const result = calculatePayroll(defaultPayrollConfig, [saturday, sunday])
    expect(result.saturdayWorkHours).toBe(8)
    expect(result.sundayWorkHours).toBe(8)
    expect(result.weekendPremiumPay).toBe(0)
  })

  it('calcula sobre o valor hora exato, soma o suplemento ao bruto e atualiza a Segurança Social', () => {
    const plans: PayrollDayPlan[] = [saturday, sunday]
    const config = { ...defaultPayrollConfig, saturdayPremiumRate: 25, sundayPremiumRate: 50 }
    const result = calculatePayroll(config, plans)
    expect(result.saturdayPremiumPay).toBe(10.62)
    expect(result.sundayPremiumPay).toBe(21.23)
    expect(result.weekendPremiumPay).toBe(31.85)
    expect(result.grossTotal).toBe(963.85)
    expect(result.socialSecurity).toBe(104.7)
    expect(result.netEstimate).toBeCloseTo(result.grossTotal - result.socialSecurity - result.irsTotal, 2)
  })

  it('usa as horas reais líquidas de pausas ou, sem turno, a duração contratual menos ausência', () => {
    const plans: PayrollDayPlan[] = [
      { ...saturday, workedHours: 6.5 },
      { ...sunday, unpaidAbsenceHours: 2 },
    ]
    const result = calculateWeekendPremium(plans, 5, 8, 20, 50)
    expect(result.saturdayWorkHours).toBe(6.5)
    expect(result.sundayWorkHours).toBe(6)
    expect(result.weekendPremiumPay).toBe(21.5)
  })

  it('não volta a pagar o acréscimo das horas já classificadas como trabalho suplementar', () => {
    const result = calculatePayroll(
      { ...defaultPayrollConfig, sundayPremiumRate: 50 },
      [{ date: sunday.date, kind: 'rest', overtimeHours: 2 }],
    )
    expect(result.sundayWorkHours).toBe(0)
    expect(result.weekendPremiumPay).toBe(0)
    expect(result.overtimePay).toBe(15.92)
  })

  it('não atribui suplementos em dias de falta, férias ou datas inválidas', () => {
    const result = calculateWeekendPremium([
      { ...sunday, kind: 'vacation' },
      { ...saturday, kind: 'absence-unjustified' },
      { ...sunday, date: '2026-02-30' },
      { ...saturday, date: 'invalida' },
    ], 5, 8, 50, 50)
    expect(result.weekendPremiumPay).toBe(0)
    expect(result.saturdayWorkHours + result.sundayWorkHours).toBe(0)
  })
})
