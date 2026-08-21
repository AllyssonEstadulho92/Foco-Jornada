import { describe, expect, it } from 'vitest'
import { DEFAULT_WORK_SCHEDULE } from '../settings/AppSettings'
import {
  formatPlannedMinutes,
  getNextScheduleEvent,
  getScheduleMilestones,
  getScheduleSummary,
} from './WorkSchedule'

describe('WorkSchedule', () => {
  it('calcula o exemplo 08:00-17:00 com pausa 11:00-11:15', () => {
    const summary = getScheduleSummary(DEFAULT_WORK_SCHEDULE)

    expect(summary.totalMinutes).toBe(540)
    expect(summary.breakMinutes).toBe(15)
    expect(summary.effectiveMinutes).toBe(525)
    expect(formatPlannedMinutes(summary.totalMinutes)).toBe('09:00')
    expect(formatPlannedMinutes(summary.breakMinutes)).toBe('00:15')
    expect(formatPlannedMinutes(summary.effectiveMinutes)).toBe('08:45')
  })

  it('cria linha Entrada -> Pausa -> Regresso -> Saída quando a segunda pausa está desligada', () => {
    expect(getScheduleMilestones(DEFAULT_WORK_SCHEDULE).map((item) => [item.label, item.time])).toEqual([
      ['Entrada', '08:00'],
      ['Pausa', '11:00'],
      ['Regresso', '11:15'],
      ['Saída', '17:00'],
    ])
  })

  it('mostra a pausa como próximo evento antes das 11:00', () => {
    const now = new Date(2026, 7, 21, 10, 30)
    expect(getNextScheduleEvent(DEFAULT_WORK_SCHEDULE, now)).toEqual({
      label: 'Próxima pausa',
      time: '11:00',
      state: 'work',
    })
  })

  it('mostra o regresso durante a pausa planeada', () => {
    const now = new Date(2026, 7, 21, 11, 5)
    expect(getNextScheduleEvent(DEFAULT_WORK_SCHEDULE, now)).toEqual({
      label: 'Regresso',
      time: '11:15',
      state: 'break',
    })
  })

  it('mostra a saída após o regresso da última pausa', () => {
    const now = new Date(2026, 7, 21, 15, 30)
    expect(getNextScheduleEvent(DEFAULT_WORK_SCHEDULE, now)).toEqual({
      label: 'Saída prevista',
      time: '17:00',
      state: 'work',
    })
  })
})
