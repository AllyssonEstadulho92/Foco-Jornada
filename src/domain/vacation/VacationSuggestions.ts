import { calculateVacationBalance, type VacationBalanceInput } from './VacationBalance'
import { simulateVacationPeriod } from './VacationPlanner'

const DAY_MS = 86_400_000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export type VacationSuggestionPreference = 'rest' | 'soon' | 'balance'

export interface VacationSuggestionInput extends VacationBalanceInput {
  requestedDays: number
  /** Campo legado: continua a excluir um mês, se configurado. */
  excludedMonth: number
  excludedMonths?: number[]
  preferredMonth?: number
  /** Até três alternativas do mês preferido; restantes meses mantêm uma opção. */
  preferredMonthOptions?: number
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

function isInExcludedMonth(timestamp: number, blockedMonths: Set<number>) {
  return blockedMonths.has(new Date(timestamp).getUTCMonth() + 1)
}

/** Descanso potencial consecutivo, contando fins de semana imediatamente adjacentes. */
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
 * Propostas apenas com a projeção pessoal e a semana padrão de segunda a sexta.
 * O ano considerado é o de asOfDate; a vista pode enviar 01/01 do ano seguinte como
 * cenário autónomo, sem transferir automaticamente saldos do ano corrente.
 * Não se inferem feriados, aprovação, disponibilidade da parceira, preços ou escalas.
 */
export function suggestVacationPeriods(input: VacationSuggestionInput): VacationSuggestion[] {
  const today = parseDate(input.asOfDate)
  const extraMonths = input.excludedMonths ?? []
  const preferredMonth = input.preferredMonth ?? 0
  const preferredMonthOptions = input.preferredMonthOptions ?? 1
  if (today === null || !Number.isInteger(input.requestedDays) || input.requestedDays < 1 ||
      input.requestedDays > 30 || !Number.isInteger(input.excludedMonth) ||
      input.excludedMonth < 0 || input.excludedMonth > 12 ||
      !Array.isArray(extraMonths) || extraMonths.some((month) => !Number.isInteger(month) || month < 1 || month > 12) ||
      !Number.isInteger(preferredMonth) || preferredMonth < 0 || preferredMonth > 12 ||
      !Number.isInteger(preferredMonthOptions) || preferredMonthOptions < 1 || preferredMonthOptions > 3) return []

  const blockedMonths = new Set([input.excludedMonth, ...extraMonths].filter((month) => month > 0))
  const year = new Date(today).getUTCFullYear()
  const yearEnd = Date.UTC(year, 11, 31)
  const alreadyRecorded = new Set(input.recordedVacationDates)
  const options: VacationSuggestion[] = []
  const annual = calculateVacationBalance(input)
  const yearEndAfter = Math.round((annual.yearEndProjectedBalanceDays - input.requestedDays + Number.EPSILON) * 10_000) / 10_000

  for (let start = today + DAY_MS; start <= yearEnd; start += DAY_MS) {
    if (!isWeekday(start) || isInExcludedMonth(start, blockedMonths)) continue

    let end = start
    let workingDays = 0
    let blockedOrBooked = false
    for (; end <= yearEnd && workingDays < input.requestedDays; end += DAY_MS) {
      if (isInExcludedMonth(end, blockedMonths)) { blockedOrBooked = true; break }
      if (!isWeekday(end)) continue
      if (alreadyRecorded.has(dateKey(end))) { blockedOrBooked = true; break }
      workingDays += 1
    }
    if (blockedOrBooked || workingDays !== input.requestedDays) continue
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

  const eligible = options.filter((option) => option.afterPeriodBalanceDays >= 0 && option.afterYearEndBalanceDays >= 0)
  eligible.sort((left, right) => {
    if (preferredMonth > 0) {
      const leftPreferred = left.month === preferredMonth
      const rightPreferred = right.month === preferredMonth
      if (leftPreferred !== rightPreferred) return leftPreferred ? -1 : 1
    }
    return orderCandidates(input.preference, left, right)
  })

  const months = new Map<number, number>()
  return eligible.filter((option) => {
    const count = months.get(option.month) ?? 0
    const limit = option.month === preferredMonth ? preferredMonthOptions : 1
    if (count >= limit) return false
    months.set(option.month, count + 1)
    return true
  })
}
