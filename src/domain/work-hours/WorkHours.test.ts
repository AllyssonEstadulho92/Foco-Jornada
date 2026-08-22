import { describe, expect, it } from 'vitest'
import { calculateWorkHours, formatHoursMinutes, type WorkHoursEntryInput } from './WorkHours'

const base: WorkHoursEntryInput = {
  date: '2026-08-21',
  plannedStart: '08:00',
  plannedEnd: '17:00',
  plannedBreakMinutes: 15,
  plannedBreaks: [{ start: '12:00', end: '12:15' }],
  actualStart: '08:00',
  actualEnd: '17:00',
  actualBreakMinutes: 15,
  actualBreaks: [{ start: '12:00', end: '12:15' }],
  reason: 'normal',
  payTreatment: 'apenas_registo',
}

describe('calculateWorkHours', () => {
  it('calcula o dia normal 08:00–17:00 com pausa 12:00–12:15', () => {
    const result = calculateWorkHours(base)
    expect(result.plannedMinutes).toBe(525)
    expect(result.workedMinutes).toBe(525)
    expect(result.scheduledWorkedMinutes).toBe(525)
    expect(result.nonWorkedMinutes).toBe(0)
    expect(result.overtimeMinutes).toBe(0)
    expect(formatHoursMinutes(result.workedMinutes)).toBe('08:45')
  })

  it('calcula exatamente saída antecipada por doença às 14:00', () => {
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
    expect(formatHoursMinutes(result.workedMinutes)).toBe('05:45')
    expect(formatHoursMinutes(result.nonWorkedMinutes)).toBe('03:00')
  })

  it('não desconta uma pausa que ainda não aconteceu quando a pessoa sai doente antes dela', () => {
    const result = calculateWorkHours({
      ...base,
      actualEnd: '10:00',
      actualBreakMinutes: 0,
      actualBreaks: [],
      reason: 'doenca',
      occurrenceStart: '10:00',
      occurrenceEnd: '17:00',
    })
    expect(result.workedMinutes).toBe(120)
    expect(result.nonWorkedMinutes).toBe(405)
    expect(result.occurrenceMinutes).toBe(405)
    expect(formatHoursMinutes(result.nonWorkedMinutes)).toBe('06:45')
  })

  it('desconta uma consulta no meio do turno mesmo quando existe regresso ao trabalho', () => {
    const result = calculateWorkHours({
      ...base,
      reason: 'consulta_medica',
      occurrenceStart: '10:00',
      occurrenceEnd: '11:00',
    })
    expect(result.workedMinutes).toBe(465)
    expect(result.nonWorkedMinutes).toBe(60)
    expect(result.occurrenceMinutes).toBe(60)
    expect(formatHoursMinutes(result.workedMinutes)).toBe('07:45')
  })

  it('mantém separadas a ausência e a hora extra, sem uma apagar a outra', () => {
    const result = calculateWorkHours({
      ...base,
      actualEnd: '18:00',
      reason: 'consulta_medica',
      occurrenceStart: '10:00',
      occurrenceEnd: '11:00',
    })
    expect(result.workedMinutes).toBe(525)
    expect(result.nonWorkedMinutes).toBe(60)
    expect(result.overtimeMinutes).toBe(60)
    expect(result.balanceMinutes).toBe(0)
  })

  it('permite classificar manualmente o período não trabalhado como remunerado para estimativa', () => {
    const result = calculateWorkHours({
      ...base,
      actualEnd: '14:00',
      reason: 'doenca',
      occurrenceStart: '14:00',
      occurrenceEnd: '17:00',
      payTreatment: 'remunerada',
    })
    expect(result.consideredMinutes).toBe(525)
  })

  it('identifica horas extra num dia sem ausência', () => {
    const result = calculateWorkHours({ ...base, actualEnd: '18:00' })
    expect(result.overtimeMinutes).toBe(60)
    expect(result.balanceMinutes).toBe(60)
  })

  it('calcula corretamente um turno que atravessa a meia-noite', () => {
    const result = calculateWorkHours({
      ...base,
      plannedStart: '22:00',
      plannedEnd: '06:00',
      plannedBreakMinutes: 15,
      plannedBreaks: [{ start: '02:00', end: '02:15' }],
      actualStart: '22:00',
      actualEnd: '06:00',
      actualBreakMinutes: 15,
      actualBreaks: [{ start: '02:00', end: '02:15' }],
    })

    expect(result.plannedMinutes).toBe(465)
    expect(result.workedMinutes).toBe(465)
    expect(result.nonWorkedMinutes).toBe(0)
    expect(result.overtimeMinutes).toBe(0)
  })

  it('não duplica minutos quando existem pausas sobrepostas', () => {
    const result = calculateWorkHours({
      ...base,
      plannedBreaks: [
        { start: '12:00', end: '12:15' },
        { start: '12:10', end: '12:30' },
      ],
      actualBreaks: [
        { start: '12:00', end: '12:15' },
        { start: '12:10', end: '12:30' },
      ],
    })

    expect(result.plannedMinutes).toBe(510)
    expect(result.workedMinutes).toBe(510)
  })

  it('retira de uma ocorrência apenas o tempo que seria efetivamente trabalhado', () => {
    const result = calculateWorkHours({
      ...base,
      reason: 'consulta_medica',
      occurrenceStart: '12:00',
      occurrenceEnd: '12:30',
    })

    expect(result.occurrenceMinutes).toBe(15)
    expect(result.nonWorkedMinutes).toBe(15)
    expect(result.workedMinutes).toBe(510)
  })
})
