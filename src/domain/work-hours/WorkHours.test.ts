import { describe, expect, it } from 'vitest'
import { calculateWorkHours, formatHoursMinutes, type WorkHoursEntryInput } from './WorkHours'

const base: WorkHoursEntryInput = {
  date: '2026-08-21',
  plannedStart: '08:00',
  plannedEnd: '17:00',
  plannedBreakMinutes: 15,
  actualStart: '08:00',
  actualEnd: '17:00',
  actualBreakMinutes: 15,
  reason: 'normal',
  payTreatment: 'apenas_registo',
}

describe('calculateWorkHours', () => {
  it('calcula o dia normal 08:00–17:00 com 15 minutos de pausa', () => {
    const result = calculateWorkHours(base)
    expect(result.plannedMinutes).toBe(525)
    expect(result.workedMinutes).toBe(525)
    expect(result.nonWorkedMinutes).toBe(0)
    expect(result.overtimeMinutes).toBe(0)
    expect(formatHoursMinutes(result.workedMinutes)).toBe('08:45')
  })

  it('calcula saída antecipada por doença sem presumir remuneração', () => {
    const result = calculateWorkHours({
      ...base,
      actualEnd: '14:00',
      reason: 'doenca',
      occurrenceStart: '14:00',
      occurrenceEnd: '17:00',
    })
    expect(result.workedMinutes).toBe(345)
    expect(result.nonWorkedMinutes).toBe(180)
    expect(result.occurrenceMinutes).toBe(180)
    expect(result.consideredMinutes).toBe(345)
    expect(formatHoursMinutes(result.balanceMinutes)).toBe('-03:00')
  })

  it('permite classificar manualmente o período não trabalhado como remunerado para estimativa', () => {
    const result = calculateWorkHours({ ...base, actualEnd: '14:00', reason: 'doenca', payTreatment: 'remunerada' })
    expect(result.consideredMinutes).toBe(525)
  })

  it('identifica horas extra quando o tempo real excede o previsto', () => {
    const result = calculateWorkHours({ ...base, actualEnd: '18:00' })
    expect(result.overtimeMinutes).toBe(60)
    expect(result.balanceMinutes).toBe(60)
  })
})
