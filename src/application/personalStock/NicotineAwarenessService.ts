import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type { StockMovement } from '../../domain/personalStock/models'
import { STICKS_ENTITY_ID, STOCK_TIMEZONE } from './PersonalStockService'
import { addCalendarDays, dateKeyInZone } from './time'

const SETTINGS_KEY = 'personal-stock:nicotine-awareness-v1'
const MICROGRAMS_PER_MG = 1000n

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
  updatedAt: string
}

export interface NicotineExposureEstimate {
  sticks: number
  minMg: string
  maxMg: string
}

export interface NicotineAwarenessSummary {
  today: NicotineExposureEstimate
  last7Days: NicotineExposureEstimate
  allTime: NicotineExposureEstimate
  profileLabel: string
  evidenceNote: string
  sourceTitle: string
  sourceUrl: string
  isEstimate: true
}

function defaultSettings(): NicotineAwarenessSettings {
  return {
    profileId: 'neo-published-range',
    customMinMg: '0.460',
    customMaxMg: '0.680',
    notes: '',
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
      return {
        profileId,
        customMinMg: typeof parsed.customMinMg === 'string' ? parsed.customMinMg : '0.460',
        customMaxMg: typeof parsed.customMaxMg === 'string' ? parsed.customMaxMg : '0.680',
        notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 4000) : '',
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : record.updatedAt,
      }
    } catch {
      return defaultSettings()
    }
  }

  async saveSettings(input: Omit<NicotineAwarenessSettings, 'updatedAt'>): Promise<NicotineAwarenessSettings> {
    if (input.notes.length > 4000) throw new Error('A nota pode ter no máximo 4000 caracteres.')
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
    const todayKey = dateKeyInZone(now, STOCK_TIMEZONE)
    const sevenDayStart = addCalendarDays(todayKey, -6)

    let allTime = 0n
    let today = 0n
    let last7Days = 0n
    for (const entry of consumed) {
      const dateKey = dateKeyInZone(new Date(entry.effectiveAt), STOCK_TIMEZONE)
      allTime += entry.sticks
      if (dateKey === todayKey) today += entry.sticks
      if (dateKey >= sevenDayStart && dateKey <= todayKey) last7Days += entry.sticks
    }

    const estimate = (sticks: bigint): NicotineExposureEstimate => ({
      sticks: safeNumber(sticks),
      minMg: formatMicrogramsAsMg(sticks * range.min),
      maxMg: formatMicrogramsAsMg(sticks * range.max),
    })

    return {
      today: estimate(today),
      last7Days: estimate(last7Days),
      allTime: estimate(allTime),
      profileLabel: range.label,
      evidenceNote: range.evidenceNote,
      sourceTitle: range.sourceTitle,
      sourceUrl: range.sourceUrl,
      isEstimate: true,
    }
  }
}
