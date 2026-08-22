import { describe, expect, it } from 'vitest'
import { DEFAULT_WORK_SCHEDULE } from '../settings/AppSettings'
import {
  formatPlannedMinutes,
  getNextScheduleEvent,
  getScheduleMilestones,
  getScheduleSummary,
  resolveWorkScheduleForDate,
} from './WorkSchedule'

describe('WorkSchedule', () => {
  const weekday = '2026-08-21'

  it('calcula 08:00-17:00 com pausa 12:00-12:15 num dia útil', () => {
    const summary = getScheduleSummary(DEFAULT_WORK_SCHEDULE, weekday)

    expect(summary.totalMinutes).toBe(540)
    expect(summary.breakMinutes).toBe(15)
    expect(summary.effectiveMinutes).toBe(525)
    expect(formatPlannedMinutes(summary.totalMinutes)).toBe('09:00')
    expect(formatPlannedMinutes(summary.breakMinutes)).toBe('00:15')
    expect(formatPlannedMinutes(summary.effectiveMinutes)).toBe('08:45')
  })

  it('cria Entrada -> Pausa -> Regresso -> Saída num dia útil', () => {
    expect(getScheduleMilestones(DEFAULT_WORK_SCHEDULE, weekday).map((item) => [item.label, item.time])).toEqual([
      ['Entrada', '08:00'],
      ['Pausa', '12:00'],
      ['Regresso', '12:15'],
      ['Saída', '17:00'],
    ])
  })

  it('mantém sábado como folga quando a data não está escalada', () => {
    const saturday = '2026-08-22'

    expect(resolveWorkScheduleForDate(DEFAULT_WORK_SCHEDULE, saturday)).toMatchObject({
      dayKind: 'saturday',
      isWorkingDay: false,
      startTime: '08:00',
      endTime: '17:00',
    })
    expect(getScheduleSummary(DEFAULT_WORK_SCHEDULE, saturday).totalMinutes).toBe(0)
    expect(getScheduleMilestones(DEFAULT_WORK_SCHEDULE, saturday)).toEqual([])
  })

  it('usa 08:00-17:00 num sábado marcado como trabalho', () => {
    const saturday = '2026-08-22'
    const schedule = { ...DEFAULT_WORK_SCHEDULE, weekendWorkDates: [saturday] }

    expect(resolveWorkScheduleForDate(schedule, saturday)).toMatchObject({
      isWorkingDay: true,
      startTime: '08:00',
      endTime: '17:00',
    })
    expect(getScheduleSummary(schedule, saturday).totalMinutes).toBe(540)
  })

  it('usa 09:00-18:00 num domingo marcado como trabalho', () => {
    const sunday = '2026-08-23'
    const schedule = { ...DEFAULT_WORK_SCHEDULE, weekendWorkDates: [sunday] }

    expect(resolveWorkScheduleForDate(schedule, sunday)).toMatchObject({
      dayKind: 'sunday',
      isWorkingDay: true,
      startTime: '09:00',
      endTime: '18:00',
    })
    expect(getScheduleMilestones(schedule, sunday).map((item) => [item.label, item.time])).toEqual([
      ['Entrada', '09:00'],
      ['Pausa', '12:00'],
      ['Regresso', '12:15'],
      ['Saída', '18:00'],
    ])
  })

  it('dá prioridade ao horário manual definido para a data', () => {
    const saturday = '2026-08-22'
    const schedule = {
      ...DEFAULT_WORK_SCHEDULE,
      dayOverrides: [{ date: saturday, startTime: '10:30', endTime: '19:00' }],
    }

    expect(resolveWorkScheduleForDate(schedule, saturday)).toMatchObject({
      isWorkingDay: true,
      startTime: '10:30',
      endTime: '19:00',
      source: 'manual',
    })
    expect(getScheduleSummary(schedule, saturday).totalMinutes).toBe(510)
  })

  it('mostra a pausa como próximo evento antes das 12:00', () => {
    const now = new Date(2026, 7, 21, 11, 30)
    expect(getNextScheduleEvent(DEFAULT_WORK_SCHEDULE, now)).toEqual({
      label: 'Próxima pausa',
      time: '12:00',
      state: 'work',
    })
  })

  it('mostra o regresso durante a pausa planeada', () => {
    const now = new Date(2026, 7, 21, 12, 5)
    expect(getNextScheduleEvent(DEFAULT_WORK_SCHEDULE, now)).toEqual({
      label: 'Regresso',
      time: '12:15',
      state: 'break',
    })
  })

  it('assinala uma folga de fim de semana no ecrã Hoje', () => {
    const now = new Date(2026, 7, 22, 10, 0)
    expect(getNextScheduleEvent(DEFAULT_WORK_SCHEDULE, now)).toEqual({
      label: 'Folga planeada',
      time: 'Hoje',
      state: 'done',
    })
  })
})
