export type GloDeviceModel = 'hyper-pro' | 'hyper-pro-plus'
export type GloHeatingMode = 'standard' | 'boost'
export type GloSessionPhase = 'idle' | 'heating' | 'session' | 'completed'

export interface GloSessionPreset {
  device: GloDeviceModel
  deviceLabel: string
  mode: GloHeatingMode
  modeLabel: string
  warmupSeconds: number
  sessionSeconds: number
  sourceUrl: string
}

export interface GloSessionStatus {
  phase: GloSessionPhase
  elapsedSeconds: number | null
  phaseRemainingSeconds: number
  overallRemainingSeconds: number
  progressPercent: number
  readyAt: string | null
  endsAt: string | null
}

const SOURCE_HYPER_PRO = 'https://www.myglo.com/pt-pt/nossos-produtos/glo-hyper-pro'
const SOURCE_HYPER_PRO_PLUS = 'https://www.myglo.com/pt-pt/nossos-produtos/glo-hyper-pro-plus'

const PRESETS: Record<GloDeviceModel, Record<GloHeatingMode, GloSessionPreset>> = {
  'hyper-pro': {
    standard: {
      device: 'hyper-pro',
      deviceLabel: 'glo Hyper Pro',
      mode: 'standard',
      modeLabel: 'Standard',
      warmupSeconds: 20,
      sessionSeconds: 270,
      sourceUrl: SOURCE_HYPER_PRO,
    },
    boost: {
      device: 'hyper-pro',
      deviceLabel: 'glo Hyper Pro',
      mode: 'boost',
      modeLabel: 'Boost',
      warmupSeconds: 15,
      sessionSeconds: 180,
      sourceUrl: SOURCE_HYPER_PRO,
    },
  },
  'hyper-pro-plus': {
    standard: {
      device: 'hyper-pro-plus',
      deviceLabel: 'glo Hyper Pro+',
      mode: 'standard',
      modeLabel: 'Standard',
      warmupSeconds: 10,
      sessionSeconds: 300,
      sourceUrl: SOURCE_HYPER_PRO_PLUS,
    },
    boost: {
      device: 'hyper-pro-plus',
      deviceLabel: 'glo Hyper Pro+',
      mode: 'boost',
      modeLabel: 'Boost',
      warmupSeconds: 10,
      sessionSeconds: 180,
      sourceUrl: SOURCE_HYPER_PRO_PLUS,
    },
  },
}

export const GLO_DEVICE_OPTIONS = [
  { value: 'hyper-pro' as const, label: 'glo Hyper Pro' },
  { value: 'hyper-pro-plus' as const, label: 'glo Hyper Pro+' },
]

export const GLO_MODE_OPTIONS = [
  { value: 'standard' as const, label: 'Standard' },
  { value: 'boost' as const, label: 'Boost' },
]

export function getGloSessionPreset(device: GloDeviceModel, mode: GloHeatingMode): GloSessionPreset {
  return PRESETS[device][mode]
}

export function getGloSessionStatus(
  startedAt: string | null,
  now = new Date(),
  preset: GloSessionPreset,
): GloSessionStatus {
  const startedAtMs = startedAt ? Date.parse(startedAt) : Number.NaN
  if (!Number.isFinite(startedAtMs)) {
    return {
      phase: 'idle',
      elapsedSeconds: null,
      phaseRemainingSeconds: 0,
      overallRemainingSeconds: 0,
      progressPercent: 0,
      readyAt: null,
      endsAt: null,
    }
  }

  const warmupSeconds = Math.max(0, Math.round(preset.warmupSeconds))
  const sessionSeconds = Math.max(1, Math.round(preset.sessionSeconds))
  const totalSeconds = warmupSeconds + sessionSeconds
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedAtMs) / 1000))
  const overallRemainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalSeconds) * 100)))
  const readyAt = new Date(startedAtMs + warmupSeconds * 1000).toISOString()
  const endsAt = new Date(startedAtMs + totalSeconds * 1000).toISOString()

  if (elapsedSeconds < warmupSeconds) {
    return {
      phase: 'heating',
      elapsedSeconds,
      phaseRemainingSeconds: warmupSeconds - elapsedSeconds,
      overallRemainingSeconds,
      progressPercent,
      readyAt,
      endsAt,
    }
  }

  if (elapsedSeconds < totalSeconds) {
    return {
      phase: 'session',
      elapsedSeconds,
      phaseRemainingSeconds: totalSeconds - elapsedSeconds,
      overallRemainingSeconds,
      progressPercent,
      readyAt,
      endsAt,
    }
  }

  return {
    phase: 'completed',
    elapsedSeconds,
    phaseRemainingSeconds: 0,
    overallRemainingSeconds: 0,
    progressPercent: 100,
    readyAt,
    endsAt,
  }
}
