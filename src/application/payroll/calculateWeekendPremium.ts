import type { PayrollDayPlan } from '../../domain/payroll/Payroll'

export interface WeekendPremiumResult {
  saturdayWorkHours: number
  sundayWorkHours: number
  saturdayPremiumPay: number
  sundayPremiumPay: number
  weekendPremiumPay: number
}

function nonNegative(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** A data é civil e não depende do fuso horário do navegador. Datas inválidas não geram abonos. */
function weekday(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) return null
  return parsed.getUTCDay()
}

/** Só incide sobre horas NORMAIS já incluídas no salário base; horas extra são pagas noutro cálculo. */
export function calculateWeekendPremium(
  plans: PayrollDayPlan[],
  hourlyRate: number,
  dailyHours: number,
  saturdayRate: number | null,
  sundayRate: number | null,
): WeekendPremiumResult {
  let saturdayHours = 0
  let sundayHours = 0

  for (const plan of plans) {
    if (plan.kind !== 'work') continue
    const day = weekday(plan.date)
    if (day !== 0 && day !== 6) continue

    // Quando existe um turno medido, já contém as pausas descontadas.
    // Nos planos antigos sem horário usa-se a duração contratual menos a ausência parcial.
    const hours = plan.workedHours !== undefined && Number.isFinite(plan.workedHours)
      ? nonNegative(plan.workedHours)
      : Math.max(0, nonNegative(dailyHours) - nonNegative(plan.unpaidAbsenceHours))
    if (day === 6) saturdayHours += hours
    else sundayHours += hours
  }

  const saturdayWorkHours = round2(saturdayHours)
  const sundayWorkHours = round2(sundayHours)
  const saturdayPremiumPay = round2(saturdayHours * nonNegative(hourlyRate) * nonNegative(saturdayRate) / 100)
  const sundayPremiumPay = round2(sundayHours * nonNegative(hourlyRate) * nonNegative(sundayRate) / 100)
  return {
    saturdayWorkHours,
    sundayWorkHours,
    saturdayPremiumPay,
    sundayPremiumPay,
    weekendPremiumPay: round2(saturdayPremiumPay + sundayPremiumPay),
  }
}
