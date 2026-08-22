export interface ScheduledBreakSettings {
  enabled: boolean
  startTime: string
  endTime: string
}

export interface WorkScheduleDayOverride {
  date: string
  startTime: string
  endTime: string
}

export interface WorkScheduleSettings {
  mode: 'fixed'
  /** Segunda a sábado, quando o sábado estiver marcado como trabalho. */
  startTime: string
  endTime: string
  /** Domingo, quando estiver marcado como trabalho. */
  sundayStartTime: string
  sundayEndTime: string
  /** Datas de sábado/domingo em que existe trabalho planeado (YYYY-MM-DD). */
  weekendWorkDates: string[]
  /** Exceções manuais por data. Uma exceção implica trabalho nesse dia. */
  dayOverrides: WorkScheduleDayOverride[]
  break1: ScheduledBreakSettings
  break2: ScheduledBreakSettings
}

export interface AppSettings {
  coffeeUnitPrice: number
  currency: 'EUR' | 'USD' | 'GBP'
  suggestedBreakIntervalMinutes: number
  workSchedule: WorkScheduleSettings
}

export const DEFAULT_WORK_SCHEDULE: WorkScheduleSettings = {
  mode: 'fixed',
  startTime: '08:00',
  endTime: '17:00',
  sundayStartTime: '09:00',
  sundayEndTime: '18:00',
  weekendWorkDates: [],
  dayOverrides: [],
  break1: {
    enabled: true,
    startTime: '11:00',
    endTime: '11:15',
  },
  break2: {
    enabled: false,
    startTime: '15:00',
    endTime: '15:15',
  },
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  coffeeUnitPrice: 0.7,
  currency: 'EUR',
  suggestedBreakIntervalMinutes: 90,
  workSchedule: DEFAULT_WORK_SCHEDULE,
}

function isValidClock(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false
  const [hours, minutes] = value.split(':').map(Number)
  return Number.isInteger(hours) && Number.isInteger(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

function validClock(value: unknown, fallback: string) {
  return isValidClock(value) ? value : fallback
}

function validDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function normalizeWeekendWorkDates(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(validDateKey))].sort()
}

function normalizeDayOverrides(value: unknown): WorkScheduleDayOverride[] {
  if (!Array.isArray(value)) return []

  const byDate = new Map<string, WorkScheduleDayOverride>()
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const candidate = item as Partial<WorkScheduleDayOverride>
    if (!validDateKey(candidate.date) || !isValidClock(candidate.startTime) || !isValidClock(candidate.endTime)) continue
    if (candidate.endTime <= candidate.startTime) continue
    byDate.set(candidate.date, {
      date: candidate.date,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
    })
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function normalizeBreak(
  value: Partial<ScheduledBreakSettings> | undefined,
  fallback: ScheduledBreakSettings,
): ScheduledBreakSettings {
  return {
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : fallback.enabled,
    startTime: validClock(value?.startTime, fallback.startTime),
    endTime: validClock(value?.endTime, fallback.endTime),
  }
}

function normalizeWorkSchedule(value: Partial<WorkScheduleSettings> | undefined): WorkScheduleSettings {
  return {
    mode: 'fixed',
    startTime: validClock(value?.startTime, DEFAULT_WORK_SCHEDULE.startTime),
    endTime: validClock(value?.endTime, DEFAULT_WORK_SCHEDULE.endTime),
    sundayStartTime: validClock(value?.sundayStartTime, DEFAULT_WORK_SCHEDULE.sundayStartTime),
    sundayEndTime: validClock(value?.sundayEndTime, DEFAULT_WORK_SCHEDULE.sundayEndTime),
    weekendWorkDates: normalizeWeekendWorkDates(value?.weekendWorkDates),
    dayOverrides: normalizeDayOverrides(value?.dayOverrides),
    break1: normalizeBreak(value?.break1, DEFAULT_WORK_SCHEDULE.break1),
    break2: normalizeBreak(value?.break2, DEFAULT_WORK_SCHEDULE.break2),
  }
}

export function normalizeSettings(value: Partial<AppSettings> | undefined): AppSettings {
  const coffeeUnitPrice = Number(value?.coffeeUnitPrice)
  const suggestedBreakIntervalMinutes = Number(value?.suggestedBreakIntervalMinutes)
  const currency = value?.currency

  return {
    coffeeUnitPrice:
      Number.isFinite(coffeeUnitPrice) && coffeeUnitPrice >= 0 && coffeeUnitPrice <= 100
        ? Math.round(coffeeUnitPrice * 100) / 100
        : DEFAULT_APP_SETTINGS.coffeeUnitPrice,
    currency: currency === 'USD' || currency === 'GBP' || currency === 'EUR' ? currency : 'EUR',
    suggestedBreakIntervalMinutes:
      Number.isFinite(suggestedBreakIntervalMinutes) &&
      suggestedBreakIntervalMinutes >= 15 &&
      suggestedBreakIntervalMinutes <= 480
        ? Math.round(suggestedBreakIntervalMinutes)
        : DEFAULT_APP_SETTINGS.suggestedBreakIntervalMinutes,
    workSchedule: normalizeWorkSchedule(value?.workSchedule),
  }
}
