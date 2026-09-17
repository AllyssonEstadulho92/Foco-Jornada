import { simulateVacationPeriod } from './VacationPlanner'
import type { VacationTrackerSettings } from './VacationBalance'

const DAY_MS = 86_400_000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export interface JointVacationPlanningInput {
  today: string
  year: number
  month: number
  requestedDays: number
  excludedMonths: readonly number[]
  recordedVacationDates: string[]
  settings: VacationTrackerSettings
}

export interface JointVacationOption {
  startDate: string
  endDate: string
  workingDays: number
  calendarDays: number
  restDays: number
  alreadyRecordedDays: number
  afterPeriodBalanceDays: number
  afterYearEndBalanceDays: number
}

function parseDate(value: string): number | null {
  const match = DATE_PATTERN.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const stamp = Date.UTC(year, month - 1, day)
  const result = new Date(stamp)
  return result.getUTCFullYear() === year && result.getUTCMonth() === month - 1 &&
    result.getUTCDate() === day ? stamp : null
}

function key(stamp: number): string {
  return new Date(stamp).toISOString().slice(0, 10)
}

function isWeekday(stamp: number): boolean {
  const weekday = new Date(stamp).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

function restDays(start: number, end: number): number {
  let first = start
  let last = end
  while (!isWeekday(first - DAY_MS)) first -= DAY_MS
  while (!isWeekday(last + DAY_MS)) last += DAY_MS
  return (last - first) / DAY_MS + 1
}

/**
 * Future-year figures are ONLY a personal scenario: no automatic carry-over of
 * current-year balances or manual corrections. A company-approved entitlement
 * and the partner's schedule cannot be inferred from this function.
 */
export function suggestJointVacationPeriods(input: JointVacationPlanningInput): JointVacationOption[] {
  const todayStamp = parseDate(input.today)
  if (todayStamp === null || !Number.isInteger(input.year) ||
    !Number.isInteger(input.month) || input.month < 1 || input.month > 12 ||
    !Number.isInteger(input.requestedDays) || input.requestedDays < 1 || input.requestedDays > 30 ||
    input.excludedMonths.some((month) => !Number.isInteger(month) || month < 1 || month > 12) ||
    input.excludedMonths.includes(input.month)) return []

  const currentYear = new Date(todayStamp).getUTCFullYear()
  if (input.year < currentYear || input.year > currentYear + 1) return []

  const futureYear = input.year > currentYear
  const referenceDate = futureYear ? `${input.year}-01-01` : input.today
  const scenarioSettings = futureYear
    ? { ...input.settings, carriedDays: 0, manualTakenDays: 0, adjustmentDays: 0 }
    : input.settings
  const booked = new Set(input.recordedVacationDates.filter((date) =>
    date.startsWith(`${input.year}-`) && parseDate(date) !== null))
  const first = Date.UTC(input.year, input.month - 1, 1)
  const last = Date.UTC(input.year, input.month, 0)
  const endOfYear = Date.UTC(input.year, 11, 31)
  const found: JointVacationOption[] = []

  for (let start = first; start <= last; start += DAY_MS) {
    if (start <= todayStamp || !isWeekday(start) || booked.has(key(start))) continue
    let cursor = start
    let total = 0
    let conflict = false

    while (cursor <= endOfYear && total < input.requestedDays) {
      const month = new Date(cursor).getUTCMonth() + 1
      if (input.excludedMonths.includes(month)) { conflict = true; break }
      if (isWeekday(cursor)) {
        if (booked.has(key(cursor))) { conflict = true; break }
        total += 1
      }
      if (total < input.requestedDays) cursor += DAY_MS
    }
    if (conflict || total !== input.requestedDays || cursor > endOfYear) continue

    const result = simulateVacationPeriod({
      ...scenarioSettings,
      asOfDate: referenceDate,
      asOfDayProgress: futureYear ? 0 : 1,
      recordedVacationDates: [...booked],
      startDate: key(start),
      endDate: key(cursor),
    })
    if (!result.valid || result.additionalDays !== input.requestedDays ||
      result.afterPeriodBalanceDays < 0 || result.afterYearEndBalanceDays < 0) continue

    found.push({
      startDate: key(start),
      endDate: key(cursor),
      workingDays: result.workingDays,
      calendarDays: result.calendarDays,
      restDays: restDays(start, cursor),
      alreadyRecordedDays: result.alreadyRecordedDays,
      afterPeriodBalanceDays: result.afterPeriodBalanceDays,
      afterYearEndBalanceDays: result.afterYearEndBalanceDays,
    })
  }

  // Whole workweeks read clearly on both desktop and mobile. If none fits,
  // offer other weekdays rather than silently discarding valid periods.
  const mondays = found.filter((option) => new Date(`${option.startDate}T00:00:00Z`).getUTCDay() === 1)
  const candidates = mondays.length > 0 ? mondays : found
  return candidates.slice(0, 4)
}
