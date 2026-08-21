import type { WorkScheduleSettings } from '../settings/AppSettings'

export interface ScheduleSummary {
  totalMinutes: number
  breakMinutes: number
  effectiveMinutes: number
}

export interface ScheduleMilestone {
  id: string
  label: string
  time: string
  minutes: number
  kind: 'entry' | 'break-start' | 'break-end' | 'exit'
}

export interface NextScheduleEvent {
  label: string
  time: string | null
  state: 'before' | 'work' | 'break' | 'done'
}

export function parseClockMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

export function formatPlannedMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function enabledBreaks(schedule: WorkScheduleSettings) {
  return [schedule.break1, schedule.break2]
    .filter((item) => item.enabled)
    .map((item, index) => {
      const start = parseClockMinutes(item.startTime)
      const end = parseClockMinutes(item.endTime)
      return start !== null && end !== null && end > start
        ? { ...item, start, end, id: `break-${index + 1}` }
        : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.start - b.start)
}

export function getScheduleSummary(schedule: WorkScheduleSettings): ScheduleSummary {
  const start = parseClockMinutes(schedule.startTime)
  const end = parseClockMinutes(schedule.endTime)
  if (start === null || end === null || end <= start) {
    return { totalMinutes: 0, breakMinutes: 0, effectiveMinutes: 0 }
  }

  const totalMinutes = end - start
  const breakMinutes = enabledBreaks(schedule).reduce((sum, item) => {
    const clippedStart = Math.max(start, item.start)
    const clippedEnd = Math.min(end, item.end)
    return sum + Math.max(0, clippedEnd - clippedStart)
  }, 0)

  return {
    totalMinutes,
    breakMinutes,
    effectiveMinutes: Math.max(0, totalMinutes - breakMinutes),
  }
}

export function getScheduleMilestones(schedule: WorkScheduleSettings): ScheduleMilestone[] {
  const start = parseClockMinutes(schedule.startTime)
  const end = parseClockMinutes(schedule.endTime)
  if (start === null || end === null || end <= start) return []

  const milestones: ScheduleMilestone[] = [
    { id: 'entry', label: 'Entrada', time: schedule.startTime, minutes: start, kind: 'entry' },
  ]

  enabledBreaks(schedule).forEach((item, index) => {
    if (item.start >= start && item.start <= end) {
      milestones.push({
        id: `${item.id}-start`,
        label: index === 0 ? 'Pausa' : 'Pausa 2',
        time: item.startTime,
        minutes: item.start,
        kind: 'break-start',
      })
    }
    if (item.end >= start && item.end <= end) {
      milestones.push({
        id: `${item.id}-end`,
        label: 'Regresso',
        time: item.endTime,
        minutes: item.end,
        kind: 'break-end',
      })
    }
  })

  milestones.push({ id: 'exit', label: 'Saída', time: schedule.endTime, minutes: end, kind: 'exit' })
  return milestones.sort((a, b) => a.minutes - b.minutes)
}

export function getNextScheduleEvent(schedule: WorkScheduleSettings, now: Date): NextScheduleEvent {
  const start = parseClockMinutes(schedule.startTime)
  const end = parseClockMinutes(schedule.endTime)
  if (start === null || end === null || end <= start) {
    return { label: 'Horário por configurar', time: null, state: 'before' }
  }

  const current = now.getHours() * 60 + now.getMinutes()
  if (current < start) return { label: 'Entrada', time: schedule.startTime, state: 'before' }
  if (current >= end) return { label: 'Jornada planeada concluída', time: null, state: 'done' }

  for (const item of enabledBreaks(schedule)) {
    if (current >= item.start && current < item.end) {
      return { label: 'Regresso', time: item.endTime, state: 'break' }
    }
    if (current < item.start) {
      return { label: 'Próxima pausa', time: item.startTime, state: 'work' }
    }
  }

  return { label: 'Saída prevista', time: schedule.endTime, state: 'work' }
}

export function getScheduleProgress(schedule: WorkScheduleSettings, now: Date): number {
  const start = parseClockMinutes(schedule.startTime)
  const end = parseClockMinutes(schedule.endTime)
  if (start === null || end === null || end <= start) return 0

  const current = now.getHours() * 60 + now.getMinutes()
  return Math.max(0, Math.min(1, (current - start) / (end - start)))
}
