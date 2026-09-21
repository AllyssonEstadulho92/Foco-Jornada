import { describe, expect, it } from 'vitest'
import { toPayrollDayPlan, type ShiftMapDay } from './ShiftMap'

describe('integração do mapa de turnos com o suplemento', () => {
  it('transmite o tempo efetivo de domingo sem a pausa e sem confundir horas extra', () => {
    const day: ShiftMapDay = {
      date: '2026-09-20',
      kind: 'work',
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 60,
      overtimeHours: 2,
      note: '',
    }
    const payroll = toPayrollDayPlan(day)
    expect(payroll.workedHours).toBe(8)
    expect(payroll.overtimeHours).toBe(2)
  })

  it('não inventa horas medidas quando o turno de fim de semana não tem horário válido', () => {
    const day: ShiftMapDay = {
      date: '2026-09-19',
      kind: 'work',
      startTime: '',
      endTime: '',
      breakMinutes: 0,
      overtimeHours: 0,
      note: '',
    }
    expect(toPayrollDayPlan(day).workedHours).toBeUndefined()
  })
})
