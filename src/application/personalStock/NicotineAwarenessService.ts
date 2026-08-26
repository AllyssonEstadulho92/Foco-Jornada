import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type { StockMovement } from '../../domain/personalStock/models'
import { STICKS_ENTITY_ID, STOCK_TIMEZONE } from './PersonalStockService'
import { addCalendarDays, dateKeyInZone } from './time'

const SETTINGS_KEY = 'personal-stock:nicotine-awareness-v1'
const MICROGRAMS_PER_MG = 1000n
const DEFAULT_DAILY_BASELINE = 13
const DEFAULT_WEEKLY_REDUCTION = 1

export type NicotineProfileId = 'neo-published-range' | 'veo-independent-range' | 'custom'

export interface NicotineReferenceProfile {
  id: Exclude<NicotineProfileId, 'custom'>
  label: string
  minMicrogramsPerStick: bigint
  maxMicrogramsPerStick: bigint
  sourceTitle: string
  sourceUrl: string
  evidenceNote: string
}

export const NICOTINE_REFERENCE_PROFILES: NicotineReferenceProfile[] = [
  {
    id: 'neo-published-range',
    label: 'Neo glo — intervalo publicado',
    minMicrogramsPerStick: 460n,
    maxMicrogramsPerStick: 680n,
    sourceTitle: 'Scientific Reports (2022) — glo/Neo',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9424205/',
    evidenceNote: 'Dois consumíveis Neo estudados produziram 0,46 e 0,68 mg de nicotina por stick num regime padronizado de máquina.',
  },
  {
    id: 'veo-independent-range',
    label: 'Veo glo — medição independente',
    minMicrogramsPerStick: 950n,
    maxMicrogramsPerStick: 980n,
    sourceTitle: 'Estudo químico independente (2026) — Veo',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13401252/',
    evidenceNote: 'Veo Green Click e Purple Click emitiram cerca de 0,95–0,98 mg de nicotina por stick em condições laboratoriais padronizadas.',
  },
]

export interface NicotineAwarenessSettings {
  profileId: NicotineProfileId
  customMinMg: string
  customMaxMg: string
  notes: string
  reductionPlanEnabled: boolean
  dailyBaselineSticks: number
  weeklyReductionStep: number
  reductionPlanStartDate: string
  updatedAt: string
}

export interface NicotineExposureEstimate {
  sticks: number
  minMg: string
  maxMg: string
}

export interface ReductionPlanSummary {
  enabled: boolean
  baselineDailySticks: number
  weeklyReductionStep: number
  startDate: string
  weekNumber: number
  targetToday: number
  nextWeekTarget: number
  consumedToday: number
  remainingToTarget: number
  overTargetBy: number
  last7DaysAverage: string
  previous7DaysAverage: string
  trendDelta: string
  daysOverTargetLast7: number
  zeroTargetDate: string
}

export interface NicotineAwarenessSummary {
  today: NicotineExposureEstimate
  last7Days: NicotineExposureEstimate
  allTime: NicotineExposureEstimate
  reductionPlan: ReductionPlanSummary
  profileLabel: string
  evidenceNote: string
  sourceTitle: string
  sourceUrl: string
  isEstimate: true
}

function todayKey(): string {
  return dateKeyInZone(new Date(), STOCK_TIMEZONE)
}

function defaultSettings(): NicotineAwarenessSettings {
  return {
    profileId: 'neo-published-range',
    customMinMg: '0.460',
    customMaxMg: '0.680',
    notes: '',
    reductionPlanEnabled: true,
    dailyBaselineSticks: DEFAULT_DAILY_BASELINE,
    weeklyReductionStep: DEFAULT_WEEKLY_REDUCTION,
    reductionPlanStartDate: todayKey(),
    updatedAt: new Date(0).toISOString(),
  }
}

function parseMgToMicrograms(value: string, label: string): bigint {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d{1,2}(?:\.\d{1,3})?$/.test(normalized)) {
    throw new Error(`${label} deve estar em mg com até 3 casas decimais.`)
  }
  const [whole, fraction = ''] = normalized.split('.')
  const micrograms = BigInt(whole) * MICROGRAMS_PER_MG + BigInt(fraction.padEnd(3, '0'))
  if (micrograms <= 0n || micrograms > 20000n) {
    throw new Error(`${label} deve estar entre 0,001 e 20 mg por stick.`)
  }
  return micrograms
}

function formatMicrogramsAsMg(value: bigint): string {
  const whole = value / MICROGRAMS_PER_MG
  const fraction = (value % MICROGRAMS_PER_MG).toString().padStart(3, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

function netConsumedSticks(movements: StockMovement[]): Array<{ effectiveAt: string; sticks: bigint }> {
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

function validDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(parsed) && new Date(parsed).toISOString().startsWith(value)
}

function positiveInteger(value: unknown, fallback: number, maximum: number): number {
  return Number.isSafeInteger(value) && Number(value) > 0 && Number(value) <= maximum ? Number(value) : fallback
}

function dayDifference(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  return Math.floor((end - start) / 86_400_000)
}

function planTargetForDate(settings: NicotineAwarenessSettings, dateKey: string): number {
  if (!settings.reductionPlanEnabled) return settings.dailyBaselineSticks
  const elapsedDays = Math.max(0, dayDifference(settings.reductionPlanStartDate, dateKey))
  const weekIndex = Math.floor(elapsedDays / 7)
  return Math.max(0, settings.dailyBaselineSticks - settings.weeklyReductionStep * (weekIndex + 1))
}

function averageString(total: bigint): string {
  return (safeNumber(total) / 7).toFixed(1)
}

export class NicotineAwarenessService {
  constructor(private readonly db: AppDatabase) {}

  async getSettings(): Promise<NicotineAwarenessSettings> {
    const record = await this.db.metadata.get(SETTINGS_KEY)
    if (!record) return defaultSettings()
    try {
      const parsed = JSON.parse(record.value) as Partial<NicotineAwarenessSettings>
      const profileId = parsed.profileId
      if (profileId !== 'neo-published-range' && profileId !== 'veo-independent-range' && profileId !== 'custom') {
        return defaultSettings()
      }
      const fallbackStartDate = dateKeyInZone(new Date(record.updatedAt), STOCK_TIMEZONE)
      return {
        profileId,
        customMinMg: typeof parsed.customMinMg === 'string' ? parsed.customMinMg : '0.460',
        customMaxMg: typeof parsed.customMaxMg === 'string' ? parsed.customMaxMg : '0.680',
        notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 4000) : '',
        reductionPlanEnabled: typeof parsed.reductionPlanEnabled === 'boolean' ? parsed.reductionPlanEnabled : true,
        dailyBaselineSticks: positiveInteger(parsed.dailyBaselineSticks, DEFAULT_DAILY_BASELINE, 200),
        weeklyReductionStep: positiveInteger(parsed.weeklyReductionStep, DEFAULT_WEEKLY_REDUCTION, 50),
        reductionPlanStartDate: validDateKey(parsed.reductionPlanStartDate) ? parsed.reductionPlanStartDate : fallbackStartDate,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : record.updatedAt,
      }
    } catch {
      return defaultSettings()
    }
  }

  async saveSettings(input: Omit<NicotineAwarenessSettings, 'updatedAt'>): Promise<NicotineAwarenessSettings> {
    if (input.notes.length > 4000) throw new Error('A nota pode ter no máximo 4000 caracteres.')
    if (!Number.isSafeInteger(input.dailyBaselineSticks) || input.dailyBaselineSticks < 1 || input.dailyBaselineSticks > 200) {
      throw new Error('A linha de base diária deve ser um número inteiro entre 1 e 200 sticks.')
    }
    if (!Number.isSafeInteger(input.weeklyReductionStep) || input.weeklyReductionStep < 1 || input.weeklyReductionStep > 50) {
      throw new Error('A redução semanal deve ser um número inteiro entre 1 e 50 sticks.')
    }
    if (!validDateKey(input.reductionPlanStartDate)) throw new Error('A data de início do plano não é válida.')
    if (input.profileId === 'custom') {
      const min = parseMgToMicrograms(input.customMinMg, 'Valor mínimo')
      const max = parseMgToMicrograms(input.customMaxMg, 'Valor máximo')
      if (max < min) throw new Error('O valor máximo não pode ser inferior ao mínimo.')
    }
    const settings: NicotineAwarenessSettings = {
      ...input,
      notes: input.notes.trimEnd(),
      updatedAt: new Date().toISOString(),
    }
    await this.db.metadata.put({ key: SETTINGS_KEY, value: JSON.stringify(settings), updatedAt: settings.updatedAt })
    return settings
  }

  private rangeFor(settings: NicotineAwarenessSettings): {
    label: string
    min: bigint
    max: bigint
    sourceTitle: string
    sourceUrl: string
    evidenceNote: string
  } {
    if (settings.profileId === 'custom') {
      const min = parseMgToMicrograms(settings.customMinMg, 'Valor mínimo')
      const max = parseMgToMicrograms(settings.customMaxMg, 'Valor máximo')
      if (max < min) throw new Error('O valor máximo não pode ser inferior ao mínimo.')
      return {
        label: 'Perfil personalizado',
        min,
        max,
        sourceTitle: 'Valor configurado pelo utilizador',
        sourceUrl: '',
        evidenceNote: 'O cálculo usa o intervalo por stick que foi configurado manualmente.',
      }
    }
    const profile = NICOTINE_REFERENCE_PROFILES.find((item) => item.id === settings.profileId)
    if (!profile) throw new Error('Perfil de nicotina desconhecido.')
    return {
      label: profile.label,
      min: profile.minMicrogramsPerStick,
      max: profile.maxMicrogramsPerStick,
      sourceTitle: profile.sourceTitle,
      sourceUrl: profile.sourceUrl,
      evidenceNote: profile.evidenceNote,
    }
  }

  async getSummary(now = new Date()): Promise<NicotineAwarenessSummary> {
    const settings = await this.getSettings()
    const range = this.rangeFor(settings)
    const movements = await this.db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray()
    const consumed = netConsumedSticks(movements)
    const todayDateKey = dateKeyInZone(now, STOCK_TIMEZONE)
    const sevenDayStart = addCalendarDays(todayDateKey, -6)
    const previousSevenStart = addCalendarDays(todayDateKey, -13)
    const previousSevenEnd = addCalendarDays(todayDateKey, -7)
    const byDay = new Map<string, bigint>()

    let allTime = 0n
    let today = 0n
    let last7Days = 0n
    let previous7Days = 0n
    for (const entry of consumed) {
      const dateKey = dateKeyInZone(new Date(entry.effectiveAt), STOCK_TIMEZONE)
      allTime += entry.sticks
      byDay.set(dateKey, (byDay.get(dateKey) ?? 0n) + entry.sticks)
      if (dateKey === todayDateKey) today += entry.sticks
      if (dateKey >= sevenDayStart && dateKey <= todayDateKey) last7Days += entry.sticks
      if (dateKey >= previousSevenStart && dateKey <= previousSevenEnd) previous7Days += entry.sticks
    }

    const estimate = (sticks: bigint): NicotineExposureEstimate => ({
      sticks: safeNumber(sticks),
      minMg: formatMicrogramsAsMg(sticks * range.min),
      maxMg: formatMicrogramsAsMg(sticks * range.max),
    })

    const elapsedDays = Math.max(0, dayDifference(settings.reductionPlanStartDate, todayDateKey))
    const weekNumber = Math.floor(elapsedDays / 7) + 1
    const targetToday = planTargetForDate(settings, todayDateKey)
    const nextWeekDate = addCalendarDays(todayDateKey, 7)
    const nextWeekTarget = planTargetForDate(settings, nextWeekDate)
    const consumedToday = safeNumber(today)
    let daysOverTargetLast7 = 0
    if (settings.reductionPlanEnabled) {
      for (let offset = 0; offset < 7; offset += 1) {
        const key = addCalendarDays(sevenDayStart, offset)
        const used = safeNumber(byDay.get(key) ?? 0n)
        if (used > planTargetForDate(settings, key)) daysOverTargetLast7 += 1
      }
    }
    const weeksUntilZero = Math.max(1, Math.ceil(settings.dailyBaselineSticks / settings.weeklyReductionStep))
    const zeroTargetDate = addCalendarDays(settings.reductionPlanStartDate, (weeksUntilZero - 1) * 7)
    const last7Average = safeNumber(last7Days) / 7
    const previous7Average = safeNumber(previous7Days) / 7

    return {
      today: estimate(today),
      last7Days: estimate(last7Days),
      allTime: estimate(allTime),
      reductionPlan: {
        enabled: settings.reductionPlanEnabled,
        baselineDailySticks: settings.dailyBaselineSticks,
        weeklyReductionStep: settings.weeklyReductionStep,
        startDate: settings.reductionPlanStartDate,
        weekNumber,
        targetToday,
        nextWeekTarget,
        consumedToday,
        remainingToTarget: Math.max(0, targetToday - consumedToday),
        overTargetBy: Math.max(0, consumedToday - targetToday),
        last7DaysAverage: averageString(last7Days),
        previous7DaysAverage: averageString(previous7Days),
        trendDelta: (last7Average - previous7Average).toFixed(1),
        daysOverTargetLast7,
        zeroTargetDate,
      },
      profileLabel: range.label,
      evidenceNote: range.evidenceNote,
      sourceTitle: range.sourceTitle,
      sourceUrl: range.sourceUrl,
      isEstimate: true,
    }
  }
}
