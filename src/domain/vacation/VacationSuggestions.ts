import { calculateVacationBalance, type VacationBalanceInput } from './VacationBalance'
import { simulateVacationPeriod } from './VacationPlanner'

const DAY_MS = 86_400_000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export type VacationSuggestionPreference = 'rest' | 'soon' | 'balance'

export interface VacationSuggestionInput extends VacationBalanceInput {
  requestedDays: number
  excludedMonth: number
  preference: VacationSuggestionPreference
}

export interface VacationSuggestion {
  startDate: string
  endDate: string
  month: number
  workingDays: number
  calendarDays: number
  restDays: number
  weekendDays: number
  afterPeriodBalanceDays: number
  afterYearEndBalanceDays: number
}

function parseDate(value: string): number | null {
  const match = DATE_PATTERN.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? timestamp
    : null
}

function dateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function isWeekday(timestamp: number) {
  const weekday = new Date(timestamp).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

function isInExcludedMonth(timestamp: number, excludedMonth: number) {
  return excludedMonth > 0 && new Date(timestamp).getUTCMonth() + 1 === excludedMonth
}

/** Potential consecutive rest days: chosen interval plus immediately adjacent Sat/Sun. */
function restDaysForRange(start: number, end: number) {
  let beginning = start
  let finish = end
  while (!isWeekday(beginning - DAY_MS)) beginning -= DAY_MS
  while (!isWeekday(finish + DAY_MS)) finish += DAY_MS
  return (finish - beginning) / DAY_MS + 1
}

function orderCandidates(preference: VacationSuggestionPreference, left: VacationSuggestion, right: VacationSuggestion) {
  if (preference === 'balance') {
    return right.afterPeriodBalanceDays - left.afterPeriodBalanceDays ||
      right.restDays - left.restDays || left.startDate.localeCompare(right.startDate)
  }
  if (preference === 'soon') {
    return left.startDate.localeCompare(right.startDate) || right.restDays - left.restDays
  }
  return right.restDays - left.restDays ||
    left.startDate.localeCompare(right.startDate) ||
    right.afterPeriodBalanceDays - left.afterPeriodBalanceDays
}

/**
 * Suggestions use ONLY the existing personal monthly model and standard Mon–Fri week.
 * No holidays, approval, prices, workplace roster or additional persistence are inferred.
 * Each proposed weekday is new; candidates overlapping already recorded weekdays are discarded.
 */
export function suggestVacationPeriods(input: VacationSuggestionInput): VacationSuggestion[] {
  const today = parseDate(input.asOfDate)
  if (today === null || !Number.isInteger(input.requestedDays) || input.requestedDays < 1 ||
      input.requestedDays > 30 || !Number.isInteger(input.excludedMonth) ||
      input.excludedMonth < 0 || input.excludedMonth > 12) return []

  const year = new Date(today).getUTCFullYear()
  const yearEnd = Date.UTC(year, 11, 31)
  const alreadyRecorded = new Set(input.recordedVacationDates)
  const options: VacationSuggestion[] = []
  const annual = calculateVacationBalance(input)
  const yearEndAfter = Math.round((annual.yearEndProjectedBalanceDays - input.requestedDays + Number.EPSILON) * 10_000) / 10_000

  for (let start = today + DAY_MS; start <= yearEnd; start += DAY_MS) {
    if (!isWeekday(start) || isInExcludedMonth(start, input.excludedMonth)) continue

    let end = start
    let workingDays = 0
    let overlaps = false
    const proposed: string[] = []
    for (; end <= yearEnd && workingDays < input.requestedDays; end += DAY_MS) {
      if (isInExcludedMonth(end, input.excludedMonth)) { overlaps = true; break }
      if (!isWeekday(end)) continue
      const key = dateKey(end)
      if (alreadyRecorded.has(key)) { overlaps = true; break }
      proposed.push(key)
      workingDays += 1
    }
    if (overlaps || workingDays !== input.requestedDays) continue
    const lastDay = end - DAY_MS
    const simulation = simulateVacationPeriod({
      ...input,
      startDate: dateKey(start),
      endDate: dateKey(lastDay),
    })
    if (!simulation.valid || simulation.additionalDays !== input.requestedDays) continue
    options.push({
      startDate: dateKey(start),
      endDate: dateKey(lastDay),
      month: new Date(start).getUTCMonth() + 1,
      workingDays: input.requestedDays,
      calendarDays: simulation.calendarDays,
      weekendDays: simulation.weekendDays,
      restDays: restDaysForRange(start, lastDay),
      afterPeriodBalanceDays: simulation.afterPeriodBalanceDays,
      afterYearEndBalanceDays: yearEndAfter,
    })
  }

  // Prefer periods that do not put the personal *projected* balance below zero at their end.
  const nonnegative = options.filter((option) => option.afterPeriodBalanceDays >= 0 && option.afterYearEndBalanceDays >= 0)
  if (nonnegative.length === 0) return []
  nonnegative.sort((left, right) => orderCandidates(input.preference, left, right))

  // One representative per starting month gives the user genuinely different months to compare.
  const months = new Set<number>()
  return nonnegative.filter((option) => {
    if (months.has(option.month)) return false
    months.add(option.month)
    return true
  })
}
