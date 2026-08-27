import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type { StockMovement } from '../../domain/personalStock/models'
import { STICKS_ENTITY_ID, STOCK_TIMEZONE } from './PersonalStockService'
import { NicotineAwarenessService, type NicotineAwarenessSettings } from './NicotineAwarenessService'
import { addCalendarDays, dateKeyInZone } from './time'

const SETTINGS_KEY = 'personal-stock:stick-pack-planner-v1'
const DEFAULT_PACK_COUNT = 12
const DEFAULT_STICKS_PER_PACK = 20
const MAX_PACK_COUNT = 10_000
const MAX_STICKS_PER_PACK = 1_000

export interface StickPackSettings {
  packCount: number
  sticksPerPack: number
  updatedAt: string
}

export interface StickPackProjection {
  settings: StickPackSettings
  configuredTotalSticks: number
  currentStockSticks: number | null
  configuredDifference: number | null
  configuredMatchesCurrent: boolean
  fullPacksRemaining: number | null
  looseSticksRemaining: number | null
  sealedPacksRemaining: number | null
  currentPackRemaining: number | null
  currentPackStarted: boolean
  currentPackPercentRemaining: number | null
  currentPackBaselineDays: string | null
  currentPackBaselineDepletionDate: string | null
  currentPackHistoricalDays: string | null
  currentPackHistoricalDepletionDate: string | null
  packEquivalent: string | null
  baselineDailySticks: number
  baselineDays: string | null
  baselineDepletionDate: string | null
  historicalDailyAverage: string | null
  historicalCoverageDays: number
  historicalReliable: boolean
  historicalDays: string | null
  historicalDepletionDate: string | null
  reductionPlanDays: number | null
  reductionPlanDepletionDate: string | null
  reductionPlanStopsBeforeDepletion: boolean
  usedToday: number
  last7DaysSticks: number
  ledgerOk: boolean
}

function defaultSettings(): StickPackSettings {
  return {
    packCount: DEFAULT_PACK_COUNT,
    sticksPerPack: DEFAULT_STICKS_PER_PACK,
    updatedAt: new Date(0).toISOString(),
  }
}

function safePositiveInteger(value: unknown, fallback: number, max: number): number {
  return Number.isSafeInteger(value) && Number(value) > 0 && Number(value) <= max ? Number(value) : fallback
}

function safeNonNegativeInteger(value: unknown, fallback: number, max: number): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= max ? Number(value) : fallback
}

function compareMovements(left: StockMovement, right: StockMovement): number {
  if (left.sequence !== right.sequence) return left.sequence - right.sequence
  return left.id.localeCompare(right.id)
}

function reconstruct(movements: StockMovement[]): { ok: boolean; balance: bigint } {
  let balance = 0n
  const ordered = [...movements].sort(compareMovements)
  for (let index = 0; index < ordered.length; index += 1) {
    const movement = ordered[index]
    if (movement.sequence !== index) return { ok: false, balance }
    let before: bigint
    let quantity: bigint
    let after: bigint
    try {
      before = BigInt(movement.balanceBeforeMinor)
      quantity = BigInt(movement.quantityMinor)
      after = BigInt(movement.balanceAfterMinor)
    } catch {
      return { ok: false, balance }
    }
    if (before !== balance) return { ok: false, balance }
    balance += quantity
    if (balance < 0n || after !== balance) return { ok: false, balance }
  }
  return { ok: true, balance }
}

function netConsumed(movements: StockMovement[]): Array<{ effectiveAt: string; sticks: bigint }> {
  const corrections = new Map<string, bigint>()
  for (const movement of movements) {
    if (!movement.correctionOf) continue
    corrections.set(
      movement.correctionOf,
      (corrections.get(movement.correctionOf) ?? 0n) + BigInt(movement.quantityMinor),
    )
  }

  return movements
    .filter((movement) => movement.type === 'consumption')
    .map((movement) => ({
      effectiveAt: movement.effectiveAt,
      sticks: -(BigInt(movement.quantityMinor) + (corrections.get(movement.id) ?? 0n)),
    }))
    .filter((entry) => entry.sticks > 0n)
}

function safeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Contagem de sticks excede o limite seguro suportado.')
  return Number(value)
}

function dayDifference(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  return Math.floor((end - start) / 86_400_000)
}

function reductionTargetForDate(settings: NicotineAwarenessSettings, dateKey: string): number {
  if (!settings.reductionPlanEnabled) return settings.dailyBaselineSticks
  const elapsedDays = dayDifference(settings.reductionPlanStartDate, dateKey)
  if (elapsedDays < 0) return settings.dailyBaselineSticks
  const weekIndex = Math.floor(elapsedDays / 7)
  return Math.max(0, settings.dailyBaselineSticks - settings.weeklyReductionStep * (weekIndex + 1))
}

function dateForRate(stock: number, dailyRate: number, today: string): { days: string; date: string } | null {
  if (stock <= 0) return { days: '0.0', date: today }
  if (!Number.isFinite(dailyRate) || dailyRate <= 0) return null
  const exactDays = stock / dailyRate
  const calendarDays = Math.max(1, Math.ceil(exactDays))
  return {
    days: exactDays.toFixed(1),
    date: addCalendarDays(today, calendarDays - 1),
  }
}

function reductionForecast(
  stock: number,
  today: string,
  consumedToday: number,
  settings: NicotineAwarenessSettings,
): { days: number | null; date: string | null; stopsBeforeDepletion: boolean } {
  if (stock <= 0) return { days: 0, date: today, stopsBeforeDepletion: false }

  let remaining = stock
  for (let offset = 0; offset < 3_650; offset += 1) {
    const dateKey = addCalendarDays(today, offset)
    const target = reductionTargetForDate(settings, dateKey)
    const projectedUse = offset === 0 ? Math.max(0, target - consumedToday) : target

    if (projectedUse <= 0) {
      if (settings.reductionPlanEnabled && target === 0) {
        return { days: null, date: null, stopsBeforeDepletion: true }
      }
      continue
    }

    remaining -= projectedUse
    if (remaining <= 0) {
      return {
        days: offset + 1,
        date: dateKey,
        stopsBeforeDepletion: false,
      }
    }
  }

  return { days: null, date: null, stopsBeforeDepletion: true }
}

export class StickPackPlannerService {
  constructor(private readonly db: AppDatabase) {}

  async getSettings(): Promise<StickPackSettings> {
    const record = await this.db.metadata.get(SETTINGS_KEY)
    if (!record) return defaultSettings()

    try {
      const parsed = JSON.parse(record.value) as Partial<StickPackSettings>
      return {
        packCount: safeNonNegativeInteger(parsed.packCount, DEFAULT_PACK_COUNT, MAX_PACK_COUNT),
        sticksPerPack: safePositiveInteger(parsed.sticksPerPack, DEFAULT_STICKS_PER_PACK, MAX_STICKS_PER_PACK),
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : record.updatedAt,
      }
    } catch {
      return defaultSettings()
    }
  }

  async saveSettings(input: { packCount: number; sticksPerPack: number }): Promise<StickPackSettings> {
    if (!Number.isSafeInteger(input.packCount) || input.packCount < 0 || input.packCount > MAX_PACK_COUNT) {
      throw new Error(`O número de maços deve ser inteiro entre 0 e ${MAX_PACK_COUNT}.`)
    }
    if (!Number.isSafeInteger(input.sticksPerPack) || input.sticksPerPack < 1 || input.sticksPerPack > MAX_STICKS_PER_PACK) {
      throw new Error(`Os sticks por maço devem ser um número inteiro entre 1 e ${MAX_STICKS_PER_PACK}.`)
    }

    const total = input.packCount * input.sticksPerPack
    if (!Number.isSafeInteger(total)) throw new Error('A quantidade total excede o limite seguro suportado.')

    const settings: StickPackSettings = {
      ...input,
      updatedAt: new Date().toISOString(),
    }
    await this.db.metadata.put({
      key: SETTINGS_KEY,
      value: JSON.stringify(settings),
      updatedAt: settings.updatedAt,
    })
    return settings
  }

  async getProjection(now = new Date()): Promise<StickPackProjection> {
    const [settings, movements, nicotineSettings] = await Promise.all([
      this.getSettings(),
      this.db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray(),
      new NicotineAwarenessService(this.db).getSettings(),
    ])

    const reconstructed = reconstruct(movements)
    const currentStockSticks = movements.length && reconstructed.ok ? safeNumber(reconstructed.balance) : movements.length ? null : null
    const consumed = netConsumed(movements)
    const today = dateKeyInZone(now, STOCK_TIMEZONE)
    const sevenDayStart = addCalendarDays(today, -6)
    let usedToday = 0n
    let last7 = 0n
    let firstObservedDay: string | null = null

    for (const item of consumed) {
      const day = dateKeyInZone(new Date(item.effectiveAt), STOCK_TIMEZONE)
      if (day === today) usedToday += item.sticks
      if (day >= sevenDayStart && day <= today) {
        last7 += item.sticks
        if (!firstObservedDay || day < firstObservedDay) firstObservedDay = day
      }
    }

    const currentStock = currentStockSticks
    const configuredTotalSticks = settings.packCount * settings.sticksPerPack
    const usedTodayNumber = safeNumber(usedToday)
    const last7Number = safeNumber(last7)
    const historicalCoverageDays = firstObservedDay
      ? Math.min(7, Math.max(1, dayDifference(firstObservedDay, today) + 1))
      : 0
    const historicalDailyAverageNumber = historicalCoverageDays > 0
      ? last7Number / historicalCoverageDays
      : 0
    const historicalReliable = historicalCoverageDays >= 3 && last7Number > 0

    const looseSticksRemaining = currentStock === null ? null : currentStock % settings.sticksPerPack
    const fullPacksRemaining = currentStock === null ? null : Math.floor(currentStock / settings.sticksPerPack)
    const currentPackStarted = currentStock !== null && currentStock > 0 && looseSticksRemaining !== 0
    const currentPackRemaining = currentStock === null
      ? null
      : currentStock <= 0
        ? 0
        : currentPackStarted
          ? looseSticksRemaining
          : 0
    const sealedPacksRemaining = currentStock === null
      ? null
      : currentPackStarted
        ? fullPacksRemaining
        : fullPacksRemaining
    const currentPackForProjection = currentStock === null || currentStock <= 0
      ? 0
      : currentPackStarted
        ? currentPackRemaining ?? 0
        : Math.min(settings.sticksPerPack, currentStock)

    const baselineForecast = currentStock === null
      ? null
      : dateForRate(currentStock, nicotineSettings.dailyBaselineSticks, today)
    const historicalForecast = currentStock === null || !historicalReliable
      ? null
      : dateForRate(currentStock, historicalDailyAverageNumber, today)
    const currentPackBaselineForecast = currentStock === null
      ? null
      : dateForRate(currentPackForProjection, nicotineSettings.dailyBaselineSticks, today)
    const currentPackHistoricalForecast = currentStock === null || !historicalReliable
      ? null
      : dateForRate(currentPackForProjection, historicalDailyAverageNumber, today)
    const reduction = currentStock === null
      ? { days: null, date: null, stopsBeforeDepletion: false }
      : reductionForecast(currentStock, today, usedTodayNumber, nicotineSettings)

    return {
      settings,
      configuredTotalSticks,
      currentStockSticks: currentStock,
      configuredDifference: currentStock === null ? null : configuredTotalSticks - currentStock,
      configuredMatchesCurrent: currentStock !== null && configuredTotalSticks === currentStock,
      fullPacksRemaining,
      looseSticksRemaining,
      sealedPacksRemaining,
      currentPackRemaining,
      currentPackStarted,
      currentPackPercentRemaining: currentStock === null
        ? null
        : currentPackForProjection <= 0
          ? 0
          : Math.round((currentPackForProjection / settings.sticksPerPack) * 100),
      currentPackBaselineDays: currentPackBaselineForecast?.days ?? null,
      currentPackBaselineDepletionDate: currentPackBaselineForecast?.date ?? null,
      currentPackHistoricalDays: currentPackHistoricalForecast?.days ?? null,
      currentPackHistoricalDepletionDate: currentPackHistoricalForecast?.date ?? null,
      packEquivalent: currentStock === null ? null : (currentStock / settings.sticksPerPack).toFixed(1),
      baselineDailySticks: nicotineSettings.dailyBaselineSticks,
      baselineDays: baselineForecast?.days ?? null,
      baselineDepletionDate: baselineForecast?.date ?? null,
      historicalDailyAverage: historicalDailyAverageNumber > 0 ? historicalDailyAverageNumber.toFixed(1) : null,
      historicalCoverageDays,
      historicalReliable,
      historicalDays: historicalForecast?.days ?? null,
      historicalDepletionDate: historicalForecast?.date ?? null,
      reductionPlanDays: reduction.days,
      reductionPlanDepletionDate: reduction.date,
      reductionPlanStopsBeforeDepletion: reduction.stopsBeforeDepletion,
      usedToday: usedTodayNumber,
      last7DaysSticks: last7Number,
      ledgerOk: reconstructed.ok,
    }
  }
}
