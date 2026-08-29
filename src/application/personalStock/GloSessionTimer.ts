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
  sourceTitle: string
  sourceUrl: string
  sourceCheckedAt: string
  sourceNote: string
}

export interface GloSessionSnapshot {
  version: 1
  device: GloDeviceModel
  deviceLabel: string
  mode: GloHeatingMode
  modeLabel: string
  warmupSeconds: number
  sessionSeconds: number
  startedAt: string
  readyAt: string
  endsAt: string
  consumptionOperationId: string | null
  sourceTitle: string
  sourceUrl: string
  sourceCheckedAt: string
  sourceNote: string
}

export interface GloSessionTimerState {
  version: 2
  device: GloDeviceModel
  mode: GloHeatingMode
  session: GloSessionSnapshot | null
}

export interface GloSessionStatus {
  phase: GloSessionPhase
  elapsedSeconds: number | null
  phaseRemainingSeconds: number
  overallRemainingSeconds: number
  progressPercent: number
  startedAt: string | null
  readyAt: string | null
  endsAt: string | null
}

const SOURCE_HYPER_PRO = 'https://www.myglo.com/pt-pt/nossos-produtos/glo-hyper-pro'
const SOURCE_HYPER_PRO_PLUS = 'https://www.myglo.com/pt-pt/nossos-produtos/glo-hyper-pro-plus'
const SOURCE_CHECKED_AT = '2026-08-29'

const PRESETS: Record<GloDeviceModel, Record<GloHeatingMode, GloSessionPreset>> = {
  'hyper-pro': {
    standard: {
      device: 'hyper-pro',
      deviceLabel: 'glo Hyper Pro',
      mode: 'standard',
      modeLabel: 'Standard',
      warmupSeconds: 20,
      sessionSeconds: 270,
      sourceTitle: 'glo Portugal — glo Hyper Pro',
      sourceUrl: SOURCE_HYPER_PRO,
      sourceCheckedAt: SOURCE_CHECKED_AT,
      sourceNote: 'Aquecimento Standard 20 s; duração da sessão Standard 4 min 30 s.',
    },
    boost: {
      device: 'hyper-pro',
      deviceLabel: 'glo Hyper Pro',
      mode: 'boost',
      modeLabel: 'Boost',
      warmupSeconds: 15,
      sessionSeconds: 180,
      sourceTitle: 'glo Portugal — glo Hyper Pro',
      sourceUrl: SOURCE_HYPER_PRO,
      sourceCheckedAt: SOURCE_CHECKED_AT,
      sourceNote: 'Aquecimento Boost 15 s; duração da sessão Boost 3 min.',
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
      sourceTitle: 'glo Portugal — glo Hyper Pro+',
      sourceUrl: SOURCE_HYPER_PRO_PLUS,
      sourceCheckedAt: SOURCE_CHECKED_AT,
      sourceNote: 'Aquecimento Standard 10 s; duração da sessão Standard 5 min.',
    },
    boost: {
      device: 'hyper-pro-plus',
      deviceLabel: 'glo Hyper Pro+',
      mode: 'boost',
      modeLabel: 'Boost',
      warmupSeconds: 10,
      sessionSeconds: 180,
      sourceTitle: 'glo Portugal — FAQ glo Hyper Pro+',
      sourceUrl: SOURCE_HYPER_PRO_PLUS,
      sourceCheckedAt: SOURCE_CHECKED_AT,
      sourceNote: 'Aquecimento Boost 10 s; a FAQ oficial indica duração Boost de 3 min.',
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

function isDevice(value: unknown): value is GloDeviceModel {
  return value === 'hyper-pro' || value === 'hyper-pro-plus'
}

function isMode(value: unknown): value is GloHeatingMode {
  return value === 'standard' || value === 'boost'
}

function validIso(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function normalizedPositiveSeconds(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.round(value)
}

export function getGloSessionPreset(device: GloDeviceModel, mode: GloHeatingMode): GloSessionPreset {
  return PRESETS[device][mode]
}

export function createGloSessionSnapshot(input: {
  device: GloDeviceModel
  mode: GloHeatingMode
  startedAt: Date | string
  consumptionOperationId?: string | null
}): GloSessionSnapshot {
  const preset = getGloSessionPreset(input.device, input.mode)
  const startedAt = input.startedAt instanceof Date ? input.startedAt : new Date(input.startedAt)
  if (!Number.isFinite(startedAt.getTime())) throw new Error('Instante de início da sessão glo inválido.')

  const readyAt = new Date(startedAt.getTime() + preset.warmupSeconds * 1000)
  const endsAt = new Date(readyAt.getTime() + preset.sessionSeconds * 1000)

  return {
    version: 1,
    device: preset.device,
    deviceLabel: preset.deviceLabel,
    mode: preset.mode,
    modeLabel: preset.modeLabel,
    warmupSeconds: preset.warmupSeconds,
    sessionSeconds: preset.sessionSeconds,
    startedAt: startedAt.toISOString(),
    readyAt: readyAt.toISOString(),
    endsAt: endsAt.toISOString(),
    consumptionOperationId: input.consumptionOperationId ?? null,
    sourceTitle: preset.sourceTitle,
    sourceUrl: preset.sourceUrl,
    sourceCheckedAt: preset.sourceCheckedAt,
    sourceNote: preset.sourceNote,
  }
}

function validateSnapshot(value: unknown): GloSessionSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const snapshot = value as Partial<GloSessionSnapshot>
  if (
    snapshot.version !== 1
    || !isDevice(snapshot.device)
    || !isMode(snapshot.mode)
    || !validIso(snapshot.startedAt)
    || !validIso(snapshot.readyAt)
    || !validIso(snapshot.endsAt)
  ) {
    return null
  }

  const warmupSeconds = normalizedPositiveSeconds(snapshot.warmupSeconds)
  const sessionSeconds = normalizedPositiveSeconds(snapshot.sessionSeconds)
  if (!warmupSeconds || !sessionSeconds) return null

  const startedAtMs = Date.parse(snapshot.startedAt)
  const expectedReadyAtMs = startedAtMs + warmupSeconds * 1000
  const expectedEndsAtMs = expectedReadyAtMs + sessionSeconds * 1000
  if (
    Date.parse(snapshot.readyAt) !== expectedReadyAtMs
    || Date.parse(snapshot.endsAt) !== expectedEndsAtMs
  ) {
    return null
  }

  return {
    version: 1,
    device: snapshot.device,
    deviceLabel: typeof snapshot.deviceLabel === 'string'
      ? snapshot.deviceLabel
      : getGloSessionPreset(snapshot.device, snapshot.mode).deviceLabel,
    mode: snapshot.mode,
    modeLabel: typeof snapshot.modeLabel === 'string'
      ? snapshot.modeLabel
      : getGloSessionPreset(snapshot.device, snapshot.mode).modeLabel,
    warmupSeconds,
    sessionSeconds,
    startedAt: snapshot.startedAt,
    readyAt: snapshot.readyAt,
    endsAt: snapshot.endsAt,
    consumptionOperationId: typeof snapshot.consumptionOperationId === 'string'
      ? snapshot.consumptionOperationId
      : null,
    sourceTitle: typeof snapshot.sourceTitle === 'string' ? snapshot.sourceTitle : '',
    sourceUrl: typeof snapshot.sourceUrl === 'string' ? snapshot.sourceUrl : '',
    sourceCheckedAt: typeof snapshot.sourceCheckedAt === 'string' ? snapshot.sourceCheckedAt : '',
    sourceNote: typeof snapshot.sourceNote === 'string' ? snapshot.sourceNote : '',
  }
}

export function defaultGloSessionTimerState(): GloSessionTimerState {
  return {
    version: 2,
    device: 'hyper-pro',
    mode: 'standard',
    session: null,
  }
}

export function parseGloSessionTimerState(raw: string | null): GloSessionTimerState {
  const fallback = defaultGloSessionTimerState()
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw) as {
      version?: unknown
      device?: unknown
      mode?: unknown
      session?: unknown
      startedAt?: unknown
    }

    const device = isDevice(parsed.device) ? parsed.device : fallback.device
    const mode = isMode(parsed.mode) ? parsed.mode : fallback.mode

    if (parsed.version === 2) {
      return {
        version: 2,
        device,
        mode,
        session: validateSnapshot(parsed.session),
      }
    }

    // Migração do formato antigo: { device, mode, startedAt }.
    return {
      version: 2,
      device,
      mode,
      session: validIso(parsed.startedAt)
        ? createGloSessionSnapshot({ device, mode, startedAt: parsed.startedAt })
        : null,
    }
  } catch {
    return fallback
  }
}

export function serializeGloSessionTimerState(state: GloSessionTimerState): string {
  return JSON.stringify(state)
}

export function getGloSessionStatus(
  session: GloSessionSnapshot | null,
  now = new Date(),
): GloSessionStatus {
  if (!session) {
    return {
      phase: 'idle',
      elapsedSeconds: null,
      phaseRemainingSeconds: 0,
      overallRemainingSeconds: 0,
      progressPercent: 0,
      startedAt: null,
      readyAt: null,
      endsAt: null,
    }
  }

  const startedAtMs = Date.parse(session.startedAt)
  const readyAtMs = Date.parse(session.readyAt)
  const endsAtMs = Date.parse(session.endsAt)
  const nowMs = now.getTime()
  const totalSeconds = session.warmupSeconds + session.sessionSeconds
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000))
  const overallRemainingSeconds = Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000))
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((Math.min(elapsedSeconds, totalSeconds) / totalSeconds) * 100)),
  )

  if (nowMs < readyAtMs) {
    return {
      phase: 'heating',
      elapsedSeconds,
      phaseRemainingSeconds: Math.max(0, Math.ceil((readyAtMs - nowMs) / 1000)),
      overallRemainingSeconds,
      progressPercent,
      startedAt: session.startedAt,
      readyAt: session.readyAt,
      endsAt: session.endsAt,
    }
  }

  if (nowMs < endsAtMs) {
    return {
      phase: 'session',
      elapsedSeconds,
      phaseRemainingSeconds: overallRemainingSeconds,
      overallRemainingSeconds,
      progressPercent,
      startedAt: session.startedAt,
      readyAt: session.readyAt,
      endsAt: session.endsAt,
    }
  }

  return {
    phase: 'completed',
    elapsedSeconds,
    phaseRemainingSeconds: 0,
    overallRemainingSeconds: 0,
    progressPercent: 100,
    startedAt: session.startedAt,
    readyAt: session.readyAt,
    endsAt: session.endsAt,
  }
}
