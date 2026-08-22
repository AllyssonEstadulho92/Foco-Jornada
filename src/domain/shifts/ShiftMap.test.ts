import { describe, expect, it } from 'vitest'
import {
  getShiftDurationMinutes,
  getShiftEffectiveMinutes,
  summarizeShiftMap,
  toPayrollDayPlan,
  type ShiftMapDay,
} from './ShiftMap'

function day(patch: Partial<ShiftMapDay> = {}): ShiftMapDay {
  return {
    date: '2026-08-03',
    kind: 'work',
    startTime: '08:00',
    endTime: '17:00',
    breakMinutes: 15,
    overtimeHours: 0,
    note: '',
    ...patch,
  }
}

describe('ShiftMap', () => {
  it('calcula turno e tempo efetivo ao minuto', () => {
    const item = day()
    expect(getShiftDurationMinutes(item)).toBe(540)
    expect(getShiftEffectiveMinutes(item)).toBe(525)
  })

  it('suporta turno que termina no dia seguinte', () => {
    const item = day({ startTime: '22:00', endTime: '06:00', breakMinutes: 30 })
    expect(getShiftDurationMinutes(item)).toBe(480)
    expect(getShiftEffectiveMinutes(item)).toBe(450)
  })

  it('não conta horas antigas quando o dia deixou de ser trabalho', () => {
    const item = day({ kind: 'rest', startTime: '08:00', endTime: '17:00', breakMinutes: 15 })
    expect(getShiftDurationMinutes(item)).toBe(0)
    expect(getShiftEffectiveMinutes(item)).toBe(0)
  })

  it('resume RH e converte a planificação para o cálculo salarial', () => {
    const days = [
      day({ date: '2026-08-03', overtimeHours: 1.5, note: 'Fecho' }),
      day({ date: '2026-08-04', kind: 'vacation', startTime: '', endTime: '', breakMinutes: 0 }),
      day({ date: '2026-08-05', kind: 'absence-justified-unpaid', startTime: '', endTime: '', breakMinutes: 0 }),
    ]

    const summary = summarizeShiftMap(days)
    expect(summary.workDays).toBe(1)
    expect(summary.vacationDays).toBe(1)
    expect(summary.unpaidAbsenceDays).toBe(1)
    expect(summary.effectiveMinutes).toBe(525)
    expect(summary.overtimeHours).toBe(1.5)

    expect(toPayrollDayPlan(days[0])).toEqual({
      date: '2026-08-03',
      kind: 'work',
      overtimeHours: 1.5,
      note: 'Fecho',
    })
  })
})
