import type { ActivityRepository } from '../activities/ActivityRepository'
import type { BreakRepository } from '../breaks/BreakRepository'
import type { CoffeeRepository } from '../coffee/CoffeeRepository'
import type { FocusRepository } from '../focus/FocusRepository'
import type { JourneyRepository } from '../journey/JourneyRepository'
import { buildDayReport, type DayReport } from './buildDayReport'

export type PeriodKind = 'week' | 'month'

export interface PeriodReport {
  kind: PeriodKind
  startDate: string
  endDate: string
  days: DayReport[]
  totals: DayReport['summary']
  activeDays: number
}

const DAY_MS = 86_400_000

function parseDateKey(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Data inválida. Usa AAAA-MM-DD.')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error('Data inválida.')
  }
  return date
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function resolvePeriod(kind: PeriodKind, anchorDate: string): { startDate: string; endDate: string } {
  const anchor = parseDateKey(anchorDate)
  if (kind === 'month') {
    const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
    const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0))
    return { startDate: dateKey(start), endDate: dateKey(end) }
  }

  const mondayOffset = (anchor.getUTCDay() + 6) % 7
  const start = new Date(anchor.getTime() - mondayOffset * DAY_MS)
  const end = new Date(start.getTime() + 6 * DAY_MS)
  return { startDate: dateKey(start), endDate: dateKey(end) }
}

export function listDateKeys(startDate: string, endDate: string): string[] {
  const start = parseDateKey(startDate)
  const end = parseDateKey(endDate)
  if (end.getTime() < start.getTime()) throw new Error('O fim do período não pode ser anterior ao início.')
  const result: string[] = []
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += DAY_MS) {
    result.push(dateKey(new Date(cursor)))
  }
  return result
}

export async function buildPeriodReport({
  kind,
  anchorDate,
  journeyRepository,
  breakRepository,
  activityRepository,
  focusRepository,
  coffeeRepository,
}: {
  kind: PeriodKind
  anchorDate: string
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
  coffeeRepository: CoffeeRepository
}): Promise<PeriodReport> {
  const { startDate, endDate } = resolvePeriod(kind, anchorDate)
  const keys = listDateKeys(startDate, endDate)
  const days = await Promise.all(
    keys.map((date) => buildDayReport({
      journeyRepository,
      breakRepository,
      activityRepository,
      focusRepository,
      coffeeRepository,
      date,
    })),
  )

  const totals = days.reduce<DayReport['summary']>(
    (acc, day) => ({
      journeyMs: acc.journeyMs + day.summary.journeyMs,
      effectiveMs: acc.effectiveMs + day.summary.effectiveMs,
      breakMs: acc.breakMs + day.summary.breakMs,
      focusMs: acc.focusMs + day.summary.focusMs,
      activityCount: acc.activityCount + day.summary.activityCount,
      coffeeCount: acc.coffeeCount + day.summary.coffeeCount,
      coffeeCost: Math.round((acc.coffeeCost + day.summary.coffeeCost) * 100) / 100,
    }),
    { journeyMs: 0, effectiveMs: 0, breakMs: 0, focusMs: 0, activityCount: 0, coffeeCount: 0, coffeeCost: 0 },
  )

  return {
    kind,
    startDate,
    endDate,
    days,
    totals,
    activeDays: days.filter((day) => day.events.length > 0).length,
  }
}
