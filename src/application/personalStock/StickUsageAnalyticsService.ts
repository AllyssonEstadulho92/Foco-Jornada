import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type { StockMovement } from '../../domain/personalStock/models'
import { STICKS_ENTITY_ID, STOCK_TIMEZONE } from './PersonalStockService'
import { addCalendarDays, dateKeyInZone } from './time'

export interface StickUsageEvent {
  id: string
  effectiveAt: string
  count: number
}

export interface StickDailyUsage {
  date: string
  count: number
}

export interface StickPacingStatus {
  targetMinutes: number
  elapsedSeconds: number | null
  remainingSeconds: number
  progressPercent: number
  ready: boolean
  nextTargetAt: string | null
}

export function getStickPacingStatus(
  lastUseAt: string | null,
  now = new Date(),
  targetMinutes = 30,
): StickPacingStatus {
  const safeTargetMinutes = Number.isFinite(targetMinutes)
    ? Math.min(180, Math.max(5, Math.round(targetMinutes)))
    : 30
  const targetSeconds = safeTargetMinutes * 60

  if (!lastUseAt || !Number.isFinite(Date.parse(lastUseAt))) {
    return {
      targetMinutes: safeTargetMinutes,
      elapsedSeconds: null,
      remainingSeconds: 0,
      progressPercent: 100,
      ready: true,
      nextTargetAt: null,
    }
  }

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - Date.parse(lastUseAt)) / 1000))
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds)
  const progressPercent = targetSeconds > 0
    ? Math.min(100, Math.max(0, Math.round((elapsedSeconds / targetSeconds) * 100)))
    : 100

  return {
    targetMinutes: safeTargetMinutes,
    elapsedSeconds,
    remainingSeconds,
    progressPercent,
    ready: remainingSeconds === 0,
    nextTargetAt: new Date(Date.parse(lastUseAt) + targetSeconds * 1000).toISOString(),
  }
}

export interface StickUsageAnalytics {
  today: string
  todayCount: number
  lastUseAt: string | null
  firstUseAtToday: string | null
  minutesSinceLastUse: number | null
  averageIntervalMinutesToday: number | null
  shortestIntervalMinutesToday: number | null
  longestIntervalMinutesToday: number | null
  activeSpanMinutesToday: number | null
  last7Days: StickDailyUsage[]
  last7Total: number
  previous7Total: number
  trendDifference: number
  trendDirection: 'up' | 'down' | 'stable'
  recentEvents: StickUsageEvent[]
}

function correctedConsumptionBalance(movements: StockMovement[]): Map<string, bigint> {
  const corrections = new Map<string, bigint>()
  for (const movement of movements) {
    if (!movement.correctionOf) continue
    corrections.set(
      movement.correctionOf,
      (corrections.get(movement.correctionOf) ?? 0n) + BigInt(movement.quantityMinor),
    )
  }
  return corrections
}

function activeUsageEvents(movements: StockMovement[]): StickUsageEvent[] {
  const corrections = correctedConsumptionBalance(movements)
  return movements
    .filter((movement) => movement.type === 'consumption')
    .map((movement) => {
      const net = BigInt(movement.quantityMinor) + (corrections.get(movement.id) ?? 0n)
      return {
        id: movement.id,
        effectiveAt: movement.effectiveAt,
        count: net < 0n ? Number(-net) : 0,
      }
    })
    .filter((event) => event.count > 0)
    .sort((left, right) => left.effectiveAt.localeCompare(right.effectiveAt) || left.id.localeCompare(right.id))
}

function intervalMinutes(left: string, right: string): number {
  return Math.max(0, Math.round((Date.parse(right) - Date.parse(left)) / 60_000))
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export class StickUsageAnalyticsService {
  constructor(private readonly db: AppDatabase) {}

  async getAnalytics(now = new Date()): Promise<StickUsageAnalytics> {
    const movements = await this.db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray()
    const events = activeUsageEvents(movements)
    const today = dateKeyInZone(now, STOCK_TIMEZONE)

    const todayEvents = events.filter(
      (event) => dateKeyInZone(new Date(event.effectiveAt), STOCK_TIMEZONE) === today,
    )
    const todayCount = sum(todayEvents.map((event) => event.count))
    const lastUseAt = events.at(-1)?.effectiveAt ?? null
    const firstUseAtToday = todayEvents.at(0)?.effectiveAt ?? null

    const intervals: number[] = []
    for (let index = 1; index < todayEvents.length; index += 1) {
      intervals.push(intervalMinutes(todayEvents[index - 1].effectiveAt, todayEvents[index].effectiveAt))
    }

    const averageIntervalMinutesToday = intervals.length
      ? Math.round(sum(intervals) / intervals.length)
      : null

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = addCalendarDays(today, index - 6)
      return {
        date,
        count: sum(
          events
            .filter((event) => dateKeyInZone(new Date(event.effectiveAt), STOCK_TIMEZONE) === date)
            .map((event) => event.count),
        ),
      }
    })

    const previous7Start = addCalendarDays(today, -13)
    const previous7End = addCalendarDays(today, -7)
    const previous7Total = sum(
      events
        .filter((event) => {
          const day = dateKeyInZone(new Date(event.effectiveAt), STOCK_TIMEZONE)
          return day >= previous7Start && day <= previous7End
        })
        .map((event) => event.count),
    )
    const last7Total = sum(last7Days.map((item) => item.count))
    const trendDifference = last7Total - previous7Total

    return {
      today,
      todayCount,
      lastUseAt,
      firstUseAtToday,
      minutesSinceLastUse: lastUseAt
        ? Math.max(0, Math.floor((now.getTime() - Date.parse(lastUseAt)) / 60_000))
        : null,
      averageIntervalMinutesToday,
      shortestIntervalMinutesToday: intervals.length ? Math.min(...intervals) : null,
      longestIntervalMinutesToday: intervals.length ? Math.max(...intervals) : null,
      activeSpanMinutesToday: todayEvents.length >= 2
        ? intervalMinutes(todayEvents[0].effectiveAt, todayEvents.at(-1)!.effectiveAt)
        : null,
      last7Days,
      last7Total,
      previous7Total,
      trendDifference,
      trendDirection: trendDifference > 0 ? 'up' : trendDifference < 0 ? 'down' : 'stable',
      recentEvents: [...events].reverse().slice(0, 20),
    }
  }
}
