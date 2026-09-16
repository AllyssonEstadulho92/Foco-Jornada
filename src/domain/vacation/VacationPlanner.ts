import {
  calculateVacationBalance,
  type VacationBalanceInput,
} from './VacationBalance'

const DAY_MS = 86_400_000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function parseCivilDate(key: string): number | null {
  const match = DATE_PATTERN.exec(key)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? timestamp
    : null
}

function dateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function isWeekday(timestamp: number): boolean {
  const weekday = new Date(timestamp).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

function nextWeekday(timestamp: number): number {
  let next = timestamp + DAY_MS
  while (!isWeekday(next)) next += DAY_MS
  return next
}

export interface VacationPeriod {
  startDate: string
  endDate: string
  workingDays: number
}

/** Conjuntos consecutivos de dias úteis FUTUROS marcados no calendário existente. */
export function listUpcomingVacationPeriods(today: string, recordedVacationDates: string[]): VacationPeriod[] {
  const todayStamp = parseCivilDate(today)
  if (todayStamp === null) return []
  const year = today.slice(0, 4)
  const dates = [...new Set(recordedVacationDates)]
    .filter((date) => date.startsWith(`${year}-`))
    .map((date) => parseCivilDate(date))
    .filter((value): value is number => value !== null && value > todayStamp && isWeekday(value))
    .sort((a, b) => a - b)

  const periods: VacationPeriod[] = []
  for (const timestamp of dates) {
    const previous = periods[periods.length - 1]
    if (previous && timestamp === nextWeekday(parseCivilDate(previous.endDate)!)) {
      previous.endDate = dateKey(timestamp)
      previous.workingDays += 1
    } else {
      periods.push({ startDate: dateKey(timestamp), endDate: dateKey(timestamp), workingDays: 1 })
    }
  }
  return periods
}

export type VacationSimulation =
  | { valid: false; message: string }
  | {
      valid: true
      startDate: string
      endDate: string
      calendarDays: number
      workingDays: number
      weekendDays: number
      alreadyRecordedDays: number
      additionalDays: number
      beforePeriodBalanceDays: number
      afterPeriodBalanceDays: number
      beforeYearEndBalanceDays: number
      afterYearEndBalanceDays: number
    }

export interface VacationSimulationInput extends VacationBalanceInput {
  startDate: string
  endDate: string
}

/** Simulação local e sem escrita: mantém o regime padrão seg.–sex. de VacationBalance. */
export function simulateVacationPeriod(input: VacationSimulationInput): VacationSimulation {
  const todayStamp = parseCivilDate(input.asOfDate)
  const startStamp = parseCivilDate(input.startDate)
  const endStamp = parseCivilDate(input.endDate)
  if (todayStamp === null || startStamp === null || endStamp === null) {
    return { valid: false, message: 'Introduz datas de início e fim válidas.' }
  }
  if (startStamp <= todayStamp) {
    return { valid: false, message: 'Escolhe um início posterior a hoje para simular férias futuras.' }
  }
  if (endStamp < startStamp) {
    return { valid: false, message: 'O fim não pode ser anterior ao início.' }
  }
  if (input.startDate.slice(0, 4) !== input.asOfDate.slice(0, 4) ||
      input.endDate.slice(0, 4) !== input.asOfDate.slice(0, 4)) {
    return { valid: false, message: 'Esta simulação abrange apenas datas do ano atual.' }
  }
  const calendarDays = (endStamp - startStamp) / DAY_MS + 1
  if (calendarDays > 366) {
    return { valid: false, message: 'O período não pode exceder um ano civil.' }
  }

  const existing = new Set(input.recordedVacationDates)
  const proposed: string[] = []
  let workingDays = 0
  let alreadyRecordedDays = 0
  for (let timestamp = startStamp; timestamp <= endStamp; timestamp += DAY_MS) {
    if (!isWeekday(timestamp)) continue
    workingDays += 1
    const key = dateKey(timestamp)
    if (existing.has(key)) alreadyRecordedDays += 1
    else proposed.push(key)
  }

  const beforeDate = dateKey(startStamp - DAY_MS)
  const before = calculateVacationBalance({
    ...input,
    asOfDate: beforeDate,
    asOfDayProgress: 1,
  })
  const after = calculateVacationBalance({
    ...input,
    asOfDate: input.endDate,
    asOfDayProgress: 1,
    recordedVacationDates: [...input.recordedVacationDates, ...proposed],
  })
  const today = calculateVacationBalance(input)
  const afterYearEndBalanceDays = Math.round(
    (today.yearEndProjectedBalanceDays - proposed.length + Number.EPSILON) * 10_000,
  ) / 10_000

  return {
    valid: true,
    startDate: input.startDate,
    endDate: input.endDate,
    calendarDays,
    workingDays,
    weekendDays: calendarDays - workingDays,
    alreadyRecordedDays,
    additionalDays: proposed.length,
    beforePeriodBalanceDays: before.monthlyLiveAvailableBalanceDays,
    afterPeriodBalanceDays: after.monthlyLiveAvailableBalanceDays,
    beforeYearEndBalanceDays: today.yearEndProjectedBalanceDays,
    afterYearEndBalanceDays,
  }
}
