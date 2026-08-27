import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type { StockMovement } from '../../domain/personalStock/models'
import { STICKS_ENTITY_ID, STOCK_TIMEZONE } from './PersonalStockService'
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

export interface StickPackUsagePeriod {
  packNumber: number
  consumedSticks: number
  actualStartAt: string | null
  actualEndAt: string | null
  status: 'completed' | 'current'
}

export interface StickPackDepletionForecast {
  sequence: number
  packNumber: number
  kind: 'current' | 'sealed'
  sticks: number
  cumulativeSticks: number
  actualStartAt: string | null
  estimatedStartDate: string | null
  estimatedDurationDays: string | null
  estimatedDepletionDate: string | null
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
  packEquivalent: string | null
  historicalDailyAverage: string | null
  historicalCoverageDays: number
  historicalReliable: boolean
  historicalDays: string | null
  historicalDepletionDate: string | null
  currentPackHistoricalDays: string | null
  currentPackHistoricalDepletionDate: string | null
  packUsagePeriods: StickPackUsagePeriod[]
  packForecasts: StickPackDepletionForecast[]
  packTrackingExact: boolean
  packTrackingIssue: string | null
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

function netConsumed(movements: StockMovement[]): Array<{ effectiveAt: string; sticks: bigint; sequence: number }> {
  const corrections = new Map<string, bigint>()
  for (const movement of movements) {
    if (!movement.correctionOf) continue
    corrections.set(
      movement.correctionOf,
      (corrections.get(movement.correctionOf) ?? 0n) + BigInt(movement.quantityMinor),
    )
  }

  return [...movements]
    .sort(compareMovements)
    .filter((movement) => movement.type === 'consumption')
    .map((movement) => ({
      effectiveAt: movement.effectiveAt,
      sticks: -(BigInt(movement.quantityMinor) + (corrections.get(movement.id) ?? 0n)),
      sequence: movement.sequence,
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

function buildPackUsagePeriods(
  consumed: Array<{ effectiveAt: string; sticks: bigint; sequence: number }>,
  sticksPerPack: number,
  initialStockSticks: number | null,
): StickPackUsagePeriod[] {
  if (!Number.isSafeInteger(sticksPerPack) || sticksPerPack <= 0) return []

  const periods: StickPackUsagePeriod[] = []
  let packNumber = 1
  const initialRemainder = initialStockSticks === null ? 0 : initialStockSticks % sticksPerPack
  let consumedInPack = initialRemainder === 0 ? 0 : sticksPerPack - initialRemainder
  let actualStartAt: string | null = null
  let actualEndAt: string | null = null

  for (const entry of consumed) {
    let remaining = safeNumber(entry.sticks)
    while (remaining > 0) {
      if (consumedInPack === 0) actualStartAt = entry.effectiveAt
      consumedInPack += 1
      actualEndAt = entry.effectiveAt
      remaining -= 1

      if (consumedInPack === sticksPerPack) {
        periods.push({
          packNumber,
          consumedSticks: consumedInPack,
          actualStartAt,
          actualEndAt,
          status: 'completed',
        })
        packNumber += 1
        consumedInPack = 0
        actualStartAt = null
        actualEndAt = null
      }
    }
  }

  if (consumedInPack > 0) {
    periods.push({
      packNumber,
      consumedSticks: consumedInPack,
      actualStartAt,
      actualEndAt: null,
      status: 'current',
    })
  }

  return periods
}

function dateForConsumptionIndex(index: number, dailyRate: number, today: string): string | null {
  if (!Number.isSafeInteger(index) || index <= 0) return null
  if (!Number.isFinite(dailyRate) || dailyRate <= 0) return null
  const calendarDays = Math.max(1, Math.ceil(index / dailyRate))
  return addCalendarDays(today, calendarDays - 1)
}

function buildPackForecasts(input: {
  currentStock: number | null
  sticksPerPack: number
  currentPackStarted: boolean
  currentPackRemaining: number | null
  historicalReliable: boolean
  historicalDailyAverage: number
  today: string
  packUsagePeriods: StickPackUsagePeriod[]
}): StickPackDepletionForecast[] {
  if (input.currentStock === null || input.currentStock <= 0) return []

  const forecasts: StickPackDepletionForecast[] = []
  let remaining = input.currentStock
  let cumulative = 0
  let sequence = 1
  const currentUsagePeriod = input.packUsagePeriods.find((period) => period.status === 'current') ?? null
  const completedPackCount = input.packUsagePeriods.filter((period) => period.status === 'completed').length
  const firstPackNumber = currentUsagePeriod?.packNumber ?? completedPackCount + 1

  while (remaining > 0) {
    const sticks = sequence === 1 && input.currentPackStarted
      ? Math.min(input.currentPackRemaining ?? 0, remaining)
      : Math.min(input.sticksPerPack, remaining)

    if (sticks <= 0) break

    const cumulativeBefore = cumulative
    cumulative += sticks
    remaining -= sticks

    const isCurrent = sequence === 1 && input.currentPackStarted
    const estimatedStartDate = input.historicalReliable && !isCurrent
      ? dateForConsumptionIndex(cumulativeBefore + 1, input.historicalDailyAverage, input.today)
      : null
    const endForecast = input.historicalReliable
      ? dateForRate(cumulative, input.historicalDailyAverage, input.today)
      : null

    forecasts.push({
      sequence,
      packNumber: firstPackNumber + sequence - 1,
      kind: isCurrent ? 'current' : 'sealed',
      sticks,
      cumulativeSticks: cumulative,
      actualStartAt: isCurrent ? currentUsagePeriod?.actualStartAt ?? null : null,
      estimatedStartDate,
      estimatedDurationDays: input.historicalReliable
        ? (sticks / input.historicalDailyAverage).toFixed(1)
        : null,
      estimatedDepletionDate: endForecast?.date ?? null,
    })

    sequence += 1
  }

  return forecasts
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
    const [settings, movements] = await Promise.all([
      this.getSettings(),
      this.db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray(),
    ])

    const reconstructed = reconstruct(movements)
    const currentStockSticks = movements.length && reconstructed.ok
      ? safeNumber(reconstructed.balance)
      : movements.length
        ? null
        : null
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
    const sealedPacksRemaining = currentStock === null ? null : fullPacksRemaining
    const currentPackForProjection = currentStock === null || currentStock <= 0
      ? 0
      : currentPackStarted
        ? currentPackRemaining ?? 0
        : Math.min(settings.sticksPerPack, currentStock)

    const initialStockMovement = [...movements]
      .sort(compareMovements)
      .find((movement) => movement.type === 'initial_stock')
    const initialStockSticks = initialStockMovement
      ? safeNumber(BigInt(initialStockMovement.balanceAfterMinor))
      : null
    const packUsagePeriods = buildPackUsagePeriods(consumed, settings.sticksPerPack, initialStockSticks)

    const hasPartialInitialStock = initialStockSticks !== null && initialStockSticks % settings.sticksPerPack !== 0
    const hasLooseRestock = movements.some((movement) =>
      movement.type === 'restock'
      && BigInt(movement.quantityMinor) % BigInt(settings.sticksPerPack) !== 0n
    )
    const hasPhysicalCountCorrection = movements.some((movement) =>
      movement.type === 'correction' && movement.correctionReason === 'physical_count'
    )
    const packTrackingExact = !hasPartialInitialStock && !hasLooseRestock && !hasPhysicalCountCorrection
    const packTrackingIssue = hasPhysicalCountCorrection
      ? 'Houve uma correção por contagem física; a associação exata entre movimentos e maços físicos pode ter mudado.'
      : hasLooseRestock
        ? 'Existe uma reposição de sticks avulsos; a fronteira entre maços físicos deixou de ser determinística.'
        : hasPartialInitialStock
          ? 'O stock inicial continha um maço parcial; o início do primeiro maço não foi observado pela aplicação.'
          : null

    const historicalForecast = currentStock === null || !historicalReliable
      ? null
      : dateForRate(currentStock, historicalDailyAverageNumber, today)
    const currentPackHistoricalForecast = currentStock === null || !historicalReliable
      ? null
      : dateForRate(currentPackForProjection, historicalDailyAverageNumber, today)
    const packForecasts = buildPackForecasts({
      currentStock,
      sticksPerPack: settings.sticksPerPack,
      currentPackStarted,
      currentPackRemaining,
      historicalReliable,
      historicalDailyAverage: historicalDailyAverageNumber,
      today,
      packUsagePeriods,
    })

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
      packEquivalent: currentStock === null ? null : (currentStock / settings.sticksPerPack).toFixed(1),
      historicalDailyAverage: historicalDailyAverageNumber > 0 ? historicalDailyAverageNumber.toFixed(1) : null,
      historicalCoverageDays,
      historicalReliable,
      historicalDays: historicalForecast?.days ?? null,
      historicalDepletionDate: historicalForecast?.date ?? null,
      currentPackHistoricalDays: currentPackHistoricalForecast?.days ?? null,
      currentPackHistoricalDepletionDate: currentPackHistoricalForecast?.date ?? null,
      packUsagePeriods,
      packForecasts,
      packTrackingExact,
      packTrackingIssue,
      usedToday: safeNumber(usedToday),
      last7DaysSticks: last7Number,
      ledgerOk: reconstructed.ok,
    }
  }
}
