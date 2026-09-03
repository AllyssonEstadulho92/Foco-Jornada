import { secureStorage } from '../../security/secureStorage'
import type { DeadlineNotificationCategory } from './deadlineNotifications'

export type NotificationScheduleMode = 'always' | 'window' | 'quiet'

export interface NotificationCategoryPreferences {
  journey: boolean
  break: boolean
  focus: boolean
  medication: boolean
  glo: boolean
  system: boolean
}

export interface NotificationSchedulePreferences {
  mode: NotificationScheduleMode
  startTime: string
  endTime: string
  weekdays: number[]
}

export interface NotificationPreferences {
  version: 1
  setupComplete: boolean
  categories: NotificationCategoryPreferences
  schedule: NotificationSchedulePreferences
}

const STORAGE_KEY = 'foco-jornada:notification-preferences:v1'
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  version: 1,
  setupComplete: false,
  categories: {
    journey: true,
    break: true,
    focus: true,
    medication: true,
    glo: false,
    system: true,
  },
  schedule: {
    mode: 'always',
    startTime: '08:00',
    endTime: '20:00',
    weekdays: [1, 2, 3, 4, 5],
  },
}

function isClock(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false
  const [hours, minutes] = value.split(':').map(Number)
  return Number.isInteger(hours)
    && Number.isInteger(minutes)
    && hours >= 0
    && hours <= 23
    && minutes >= 0
    && minutes <= 59
}

function normalizeWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_NOTIFICATION_PREFERENCES.schedule.weekdays]
  const normalized = [...new Set(
    value.filter((item): item is number => Number.isInteger(item) && item >= 0 && item <= 6),
  )].sort((left, right) => left - right)
  return normalized.length ? normalized : [...ALL_WEEKDAYS]
}

function normalizeMode(value: unknown): NotificationScheduleMode {
  return value === 'window' || value === 'quiet' || value === 'always' ? value : 'always'
}

function normalizeCategories(value: unknown): NotificationCategoryPreferences {
  const candidate = value && typeof value === 'object'
    ? value as Partial<NotificationCategoryPreferences>
    : {}

  return {
    journey: typeof candidate.journey === 'boolean' ? candidate.journey : true,
    break: typeof candidate.break === 'boolean' ? candidate.break : true,
    focus: typeof candidate.focus === 'boolean' ? candidate.focus : true,
    medication: typeof candidate.medication === 'boolean' ? candidate.medication : true,
    glo: typeof candidate.glo === 'boolean' ? candidate.glo : false,
    system: typeof candidate.system === 'boolean' ? candidate.system : true,
  }
}

export function normalizeNotificationPreferences(value: unknown): NotificationPreferences {
  const candidate = value && typeof value === 'object'
    ? value as Partial<NotificationPreferences>
    : {}
  const schedule = candidate.schedule && typeof candidate.schedule === 'object'
    ? candidate.schedule as Partial<NotificationSchedulePreferences>
    : {}

  return {
    version: 1,
    setupComplete: candidate.setupComplete === true,
    categories: normalizeCategories(candidate.categories),
    schedule: {
      mode: normalizeMode(schedule.mode),
      startTime: isClock(schedule.startTime)
        ? schedule.startTime
        : DEFAULT_NOTIFICATION_PREFERENCES.schedule.startTime,
      endTime: isClock(schedule.endTime)
        ? schedule.endTime
        : DEFAULT_NOTIFICATION_PREFERENCES.schedule.endTime,
      weekdays: normalizeWeekdays(schedule.weekdays),
    },
  }
}

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const raw = secureStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_NOTIFICATION_PREFERENCES)
    return normalizeNotificationPreferences(JSON.parse(raw))
  } catch {
    return structuredClone(DEFAULT_NOTIFICATION_PREFERENCES)
  }
}

export function saveNotificationPreferences(value: NotificationPreferences): NotificationPreferences {
  const normalized = normalizeNotificationPreferences(value)
  secureStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function notificationCategoryEnabled(
  category: DeadlineNotificationCategory | undefined,
  preferences = loadNotificationPreferences(),
): boolean {
  return preferences.categories[category ?? 'system']
}

function minutesForClock(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function timeInsideRange(nowMinutes: number, start: number, end: number): boolean {
  if (start === end) return true
  if (start < end) return nowMinutes >= start && nowMinutes < end
  return nowMinutes >= start || nowMinutes < end
}

export function notificationScheduleAllows(
  at: Date,
  preferences = loadNotificationPreferences(),
): boolean {
  const schedule = preferences.schedule
  if (schedule.mode === 'always') return true

  const weekdayEnabled = schedule.weekdays.includes(at.getDay())
  const current = at.getHours() * 60 + at.getMinutes()
  const start = minutesForClock(schedule.startTime)
  const end = minutesForClock(schedule.endTime)
  const inside = weekdayEnabled && timeInsideRange(current, start, end)

  return schedule.mode === 'window' ? inside : !inside
}

export function shouldDeliverSystemNotification(
  category: DeadlineNotificationCategory | undefined,
  at = new Date(),
  preferences = loadNotificationPreferences(),
): boolean {
  return notificationCategoryEnabled(category, preferences)
    && notificationScheduleAllows(at, preferences)
}

export function activeCategoryCount(preferences = loadNotificationPreferences()): number {
  return Object.values(preferences.categories).filter(Boolean).length
}

export function notificationScheduleSummary(preferences = loadNotificationPreferences()): string {
  const { schedule } = preferences
  if (schedule.mode === 'always') return 'Sempre'
  if (schedule.mode === 'window') return `${schedule.startTime}–${schedule.endTime}`
  return `Não perturbar · ${schedule.startTime}–${schedule.endTime}`
}
