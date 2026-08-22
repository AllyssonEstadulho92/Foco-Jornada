import type { PayrollDayKind, PayrollDayPlan } from '../payroll/Payroll'

export interface ShiftMapDay {
  date: string
  kind: PayrollDayKind
  startTime: string
  endTime: string
  breakMinutes: number
  overtimeHours: number
  note: string
}

export interface ShiftMapSummary {
  plannedMinutes: number
  breakMinutes: number
  effectiveMinutes: number
  overtimeHours: number
  workDays: number
  restDays: number
  holidayDays: number
  vacationDays: number
  paidAbsenceDays: number
  unpaidAbsenceDays: number
}

function clockMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

export function getShiftDurationMinutes(day: ShiftMapDay): number {
  // Folga, feriado, férias e faltas não podem herdar horas antigas do editor.
  // Trabalho nesses dias entra separadamente em overtimeHours quando for remunerável.
  if (day.kind !== 'work') return 0

  const start = clockMinutes(day.startTime)
  const end = clockMinutes(day.endTime)
  if (start === null || end === null) return 0

  const normalizedEnd = end <= start ? end + 24 * 60 : end
  return Math.max(0, normalizedEnd - start)
}

export function getShiftEffectiveMinutes(day: ShiftMapDay): number {
  const duration = getShiftDurationMinutes(day)
  const breakMinutes = Number.isFinite(day.breakMinutes) ? Math.max(0, day.breakMinutes) : 0
  return Math.max(0, duration - Math.min(duration, breakMinutes))
}

export function summarizeShiftMap(days: ShiftMapDay[]): ShiftMapSummary {
  return days.reduce<ShiftMapSummary>(
    (summary, day) => {
      const duration = getShiftDurationMinutes(day)
      const effective = getShiftEffectiveMinutes(day)
      const appliedBreak = Math.max(0, duration - effective)

      summary.plannedMinutes += duration
      summary.breakMinutes += appliedBreak
      summary.effectiveMinutes += effective
      summary.overtimeHours += Number.isFinite(day.overtimeHours) ? Math.max(0, day.overtimeHours) : 0

      if (day.kind === 'work') summary.workDays += 1
      if (day.kind === 'rest') summary.restDays += 1
      if (day.kind === 'holiday') summary.holidayDays += 1
      if (day.kind === 'vacation') summary.vacationDays += 1
      if (day.kind === 'absence-justified-paid') summary.paidAbsenceDays += 1
      if (day.kind === 'absence-justified-unpaid' || day.kind === 'absence-unjustified') {
        summary.unpaidAbsenceDays += 1
      }

      return summary
    },
    {
      plannedMinutes: 0,
      breakMinutes: 0,
      effectiveMinutes: 0,
      overtimeHours: 0,
      workDays: 0,
      restDays: 0,
      holidayDays: 0,
      vacationDays: 0,
      paidAbsenceDays: 0,
      unpaidAbsenceDays: 0,
    },
  )
}

export function toPayrollDayPlan(day: ShiftMapDay): PayrollDayPlan {
  return {
    date: day.date,
    kind: day.kind,
    overtimeHours: Math.max(0, Number.isFinite(day.overtimeHours) ? day.overtimeHours : 0),
    note: day.note.trim() || undefined,
  }
}
