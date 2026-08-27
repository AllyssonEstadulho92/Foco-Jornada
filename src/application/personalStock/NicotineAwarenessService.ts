import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type { StockMovement } from '../../domain/personalStock/models'
import { STICKS_ENTITY_ID, STOCK_TIMEZONE } from './PersonalStockService'
import { addCalendarDays, dateKeyInZone } from './time'

const SETTINGS_KEY = 'personal-stock:nicotine-awareness-v2'
const MICROGRAMS_PER_MG = 1000n

export type NicotineProfileId =
  | 'unselected'
  | 'veo-green-click-2026'
  | 'veo-purple-click-2026'
  | 'custom-lab'

export interface NicotineReferenceProfile {
  id: Exclude<NicotineProfileId, 'unselected' | 'custom-lab'>
  label: string
  contentMeanMicrogramsPerStick: bigint
  contentSdMicrogramsPerStick: bigint
  emissionMeanMicrogramsPerStick: bigint
  emissionSdMicrogramsPerStick: bigint
  sourceTitle: string
  sourceUrl: string
  manufacturerTitle: string
  manufacturerUrl: string
  evidenceNote: string
}

export const NICOTINE_REFERENCE_PROFILES: NicotineReferenceProfile[] = [
  {
    id: 'veo-green-click-2026',
    label: 'veo Green Click — medição laboratorial 2026',
    contentMeanMicrogramsPerStick: 3460n,
    contentSdMicrogramsPerStick: 310n,
    emissionMeanMicrogramsPerStick: 980n,
    emissionSdMicrogramsPerStick: 30n,
    sourceTitle: 'Pauwels et al. (2026) — nicotine heat sticks without tobacco',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13401252/',
    manufacturerTitle: 'glo / BAT — informação oficial sobre veo',
    manufacturerUrl: 'https://glo-gr.myshopify.com/en-gr/products/heated-tobacco-sticks-with-capsules-veo-demi-slim-tropical-twist',
    evidenceNote: 'No estudo, veo Green Click apresentou 3,46 ± 0,31 mg de nicotina total no stick e 0,98 ± 0,03 mg na emissão por stick sob condições laboratoriais padronizadas.',
  },
  {
    id: 'veo-purple-click-2026',
    label: 'veo Purple Click — medição laboratorial 2026',
    contentMeanMicrogramsPerStick: 3220n,
    contentSdMicrogramsPerStick: 80n,
    emissionMeanMicrogramsPerStick: 950n,
    emissionSdMicrogramsPerStick: 40n,
    sourceTitle: 'Pauwels et al. (2026) — nicotine heat sticks without tobacco',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13401252/',
    manufacturerTitle: 'glo / BAT — informação oficial sobre veo',
    manufacturerUrl: 'https://glo-gr.myshopify.com/en-gr/products/heated-tobacco-sticks-with-capsules-veo-demi-slim-tropical-twist',
    evidenceNote: 'No estudo, veo Purple Click apresentou 3,22 ± 0,08 mg de nicotina total no stick e 0,95 ± 0,04 mg na emissão por stick sob condições laboratoriais padronizadas.',
  },
]

export interface NicotineAwarenessSettings {
  profileId: NicotineProfileId
  customContentMeanMg: string
  customEmissionMeanMg: string
  customSourceLabel: string
  notes: string
  updatedAt: string
}

export interface NicotineExposureEstimate {
  sticks: number
  contentLabMeanMg: string | null
  emissionLabMeanMg: string | null
}

export interface NicotineAwarenessSummary {
  today: NicotineExposureEstimate
  last7Days: NicotineExposureEstimate
  allTime: NicotineExposureEstimate
  selected: boolean
  profileLabel: string
  contentPerStickMeanMg: string | null
  contentPerStickSdMg: string | null
  emissionPerStickMeanMg: string | null
  emissionPerStickSdMg: string | null
  evidenceNote: string
  sourceTitle: string
  sourceUrl: string
  manufacturerTitle: string
  manufacturerUrl: string
  absorptionStatement: string
  calculationStatement: string
  isEstimate: true
}

function defaultSettings(): NicotineAwarenessSettings {
  return {
    profileId: 'unselected',
    customContentMeanMg: '',
    customEmissionMeanMg: '',
    customSourceLabel: '',
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

type ResolvedProfile = {
  label: string
  contentMean: bigint
  contentSd: bigint | null
  emissionMean: bigint
  emissionSd: bigint | null
  sourceTitle: string
  sourceUrl: string
  manufacturerTitle: string
  manufacturerUrl: string
  evidenceNote: string
}

export class NicotineAwarenessService {
  constructor(private readonly db: AppDatabase) {}

  async getSettings(): Promise<NicotineAwarenessSettings> {
    const record = await this.db.metadata.get(SETTINGS_KEY)
    if (!record) return defaultSettings()

    try {
      const parsed = JSON.parse(record.value) as Partial<NicotineAwarenessSettings>
      const profileId = parsed.profileId
      if (
        profileId !== 'unselected'
        && profileId !== 'veo-green-click-2026'
        && profileId !== 'veo-purple-click-2026'
        && profileId !== 'custom-lab'
      ) {
        return defaultSettings()
      }
      return {
        profileId,
        customContentMeanMg: typeof parsed.customContentMeanMg === 'string' ? parsed.customContentMeanMg : '',
        customEmissionMeanMg: typeof parsed.customEmissionMeanMg === 'string' ? parsed.customEmissionMeanMg : '',
        customSourceLabel: typeof parsed.customSourceLabel === 'string' ? parsed.customSourceLabel.slice(0, 300) : '',
        notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, 4000) : '',
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : record.updatedAt,
      }
    } catch {
      return defaultSettings()
    }
  }

  async saveSettings(input: Omit<NicotineAwarenessSettings, 'updatedAt'>): Promise<NicotineAwarenessSettings> {
    if (input.notes.length > 4000) throw new Error('A nota pode ter no máximo 4000 caracteres.')
    if (input.customSourceLabel.length > 300) throw new Error('A descrição da fonte pode ter no máximo 300 caracteres.')

    if (input.profileId === 'custom-lab') {
      parseMgToMicrograms(input.customContentMeanMg, 'Conteúdo total')
      parseMgToMicrograms(input.customEmissionMeanMg, 'Emissão')
      if (!input.customSourceLabel.trim()) {
        throw new Error('Indica a fonte do valor laboratorial personalizado.')
      }
    }

    const settings: NicotineAwarenessSettings = {
      ...input,
      notes: input.notes.trimEnd(),
      customSourceLabel: input.customSourceLabel.trim(),
      updatedAt: new Date().toISOString(),
    }
    await this.db.metadata.put({
      key: SETTINGS_KEY,
      value: JSON.stringify(settings),
      updatedAt: settings.updatedAt,
    })
    return settings
  }

  private resolveProfile(settings: NicotineAwarenessSettings): ResolvedProfile | null {
    if (settings.profileId === 'unselected') return null

    if (settings.profileId === 'custom-lab') {
      return {
        label: 'Valor laboratorial personalizado',
        contentMean: parseMgToMicrograms(settings.customContentMeanMg, 'Conteúdo total'),
        contentSd: null,
        emissionMean: parseMgToMicrograms(settings.customEmissionMeanMg, 'Emissão'),
        emissionSd: null,
        sourceTitle: settings.customSourceLabel,
        sourceUrl: '',
        manufacturerTitle: '',
        manufacturerUrl: '',
        evidenceNote: 'O cálculo usa os valores laboratoriais registados manualmente e a fonte guardada pelo utilizador.',
      }
    }

    const profile = NICOTINE_REFERENCE_PROFILES.find((item) => item.id === settings.profileId)
    if (!profile) throw new Error('Perfil de nicotina desconhecido.')
    return {
      label: profile.label,
      contentMean: profile.contentMeanMicrogramsPerStick,
      contentSd: profile.contentSdMicrogramsPerStick,
      emissionMean: profile.emissionMeanMicrogramsPerStick,
      emissionSd: profile.emissionSdMicrogramsPerStick,
      sourceTitle: profile.sourceTitle,
      sourceUrl: profile.sourceUrl,
      manufacturerTitle: profile.manufacturerTitle,
      manufacturerUrl: profile.manufacturerUrl,
      evidenceNote: profile.evidenceNote,
    }
  }

  async getSummary(now = new Date()): Promise<NicotineAwarenessSummary> {
    const settings = await this.getSettings()
    const profile = this.resolveProfile(settings)
    const movements = await this.db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray()
    const consumed = netConsumedSticks(movements)
    const todayDateKey = dateKeyInZone(now, STOCK_TIMEZONE)
    const sevenDayStart = addCalendarDays(todayDateKey, -6)

    let allTime = 0n
    let today = 0n
    let last7Days = 0n
    for (const entry of consumed) {
      const dateKey = dateKeyInZone(new Date(entry.effectiveAt), STOCK_TIMEZONE)
      allTime += entry.sticks
      if (dateKey === todayDateKey) today += entry.sticks
      if (dateKey >= sevenDayStart && dateKey <= todayDateKey) last7Days += entry.sticks
    }

    const estimate = (sticks: bigint): NicotineExposureEstimate => ({
      sticks: safeNumber(sticks),
      contentLabMeanMg: profile ? formatMicrogramsAsMg(sticks * profile.contentMean) : null,
      emissionLabMeanMg: profile ? formatMicrogramsAsMg(sticks * profile.emissionMean) : null,
    })

    return {
      today: estimate(today),
      last7Days: estimate(last7Days),
      allTime: estimate(allTime),
      selected: Boolean(profile),
      profileLabel: profile?.label ?? 'Seleciona a variante veo para calcular',
      contentPerStickMeanMg: profile ? formatMicrogramsAsMg(profile.contentMean) : null,
      contentPerStickSdMg: profile?.contentSd !== null && profile?.contentSd !== undefined
        ? formatMicrogramsAsMg(profile.contentSd)
        : null,
      emissionPerStickMeanMg: profile ? formatMicrogramsAsMg(profile.emissionMean) : null,
      emissionPerStickSdMg: profile?.emissionSd !== null && profile?.emissionSd !== undefined
        ? formatMicrogramsAsMg(profile.emissionSd)
        : null,
      evidenceNote: profile?.evidenceNote ?? 'Nenhum valor é assumido até selecionares uma variante estudada ou registares um valor laboratorial com fonte.',
      sourceTitle: profile?.sourceTitle ?? '',
      sourceUrl: profile?.sourceUrl ?? '',
      manufacturerTitle: profile?.manufacturerTitle ?? '',
      manufacturerUrl: profile?.manufacturerUrl ?? '',
      absorptionStatement: 'A dose absorvida pelo organismo não pode ser calculada com exatidão a partir do valor do stick ou da emissão de máquina. A aplicação não apresenta esse número como dose corporal.',
      calculationStatement: 'Os totais apresentados são multiplicações determinísticas do número exato de sticks registados pela média laboratorial publicada para a variante selecionada.',
      isEstimate: true,
    }
  }
}
