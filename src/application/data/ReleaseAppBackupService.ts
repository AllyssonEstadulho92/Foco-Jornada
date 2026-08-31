import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import { AppBackupService, type AppBackupPayload } from './AppBackupService'

export interface BackupKeyValueStorage {
  readonly length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface ReleaseBackupClientState {
  version: 1
  values: Record<string, string>
}

type ReleaseAppBackupPayload = AppBackupPayload & {
  clientState?: ReleaseBackupClientState
}

const CLIENT_STATE_EXACT_KEYS = new Set([
  'foco-jornada-work-hours-v1',
  'foco-jornada-payroll-config-v1',
  'foco-jornada-payroll-profile-v1',
  'foco-jornada-notifications-v1',
  'foco-jornada-ui-v2',
  'foco-jornada:glo-session-timer-v1',
  'foco-jornada:glo-session-timer-v2',
])

const CLIENT_STATE_PREFIXES = [
  'foco-jornada-payroll-plan-v1-',
  'foco-jornada-shift-map-v1-',
]

function isAllowedClientStateKey(key: string): boolean {
  return CLIENT_STATE_EXACT_KEYS.has(key)
    || CLIENT_STATE_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function collectClientState(storage: BackupKeyValueStorage): Record<string, string> {
  const values: Record<string, string> = {}
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key || !isAllowedClientStateKey(key)) continue
    const value = storage.getItem(key)
    if (value !== null) values[key] = value
  }
  return values
}

function replaceClientState(storage: BackupKeyValueStorage, values: Record<string, string>): void {
  const keysToRemove: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key && isAllowedClientStateKey(key)) keysToRemove.push(key)
  }

  keysToRemove.forEach((key) => storage.removeItem(key))
  Object.entries(values).forEach(([key, value]) => {
    if (isAllowedClientStateKey(key)) storage.setItem(key, value)
  })
}

function parseClientState(text: string): ReleaseBackupClientState | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const clientState = (parsed as { clientState?: unknown }).clientState
  if (clientState === undefined) return null
  if (!clientState || typeof clientState !== 'object' || Array.isArray(clientState)) {
    throw new Error('A cópia contém um estado local auxiliar inválido.')
  }

  const candidate = clientState as { version?: unknown; values?: unknown }
  if (candidate.version !== 1 || !candidate.values || typeof candidate.values !== 'object' || Array.isArray(candidate.values)) {
    throw new Error('A cópia contém uma versão de estado local auxiliar não suportada.')
  }

  const values: Record<string, string> = {}
  for (const [key, value] of Object.entries(candidate.values as Record<string, unknown>)) {
    if (!isAllowedClientStateKey(key)) {
      throw new Error(`A cópia contém uma chave local não autorizada: ${key}.`)
    }
    if (typeof value !== 'string') {
      throw new Error(`A cópia contém um valor local inválido em ${key}.`)
    }
    values[key] = value
  }

  return { version: 1, values }
}

export class ReleaseAppBackupService extends AppBackupService {
  constructor(
    database: AppDatabase,
    private readonly clientStorage?: BackupKeyValueStorage,
  ) {
    super(database)
  }

  override async exportText(): Promise<string> {
    const raw = await super.exportText()
    const payload = JSON.parse(raw) as ReleaseAppBackupPayload
    payload.appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : payload.appVersion

    if (this.clientStorage) {
      payload.clientState = {
        version: 1,
        values: collectClientState(this.clientStorage),
      }
    }

    return JSON.stringify(payload, null, 2)
  }

  override async restoreFromText(text: string) {
    const clientState = parseClientState(text)
    if (!this.clientStorage || !clientState) return super.restoreFromText(text)

    const previousState = collectClientState(this.clientStorage)
    try {
      replaceClientState(this.clientStorage, clientState.values)
      return await super.restoreFromText(text)
    } catch (error) {
      try {
        replaceClientState(this.clientStorage, previousState)
      } catch {
        // A falha de rollback do armazenamento auxiliar não deve ocultar a causa original.
      }
      throw error
    }
  }
}
