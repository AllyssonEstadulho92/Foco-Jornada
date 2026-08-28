import type { AppDatabase, AppMetadataRecord } from '../../infrastructure/database/appDatabase'
import type { StockEntity, StockMovement } from '../../domain/personalStock/models'
import { STICKS_ENTITY_ID } from './PersonalStockService'

const CURRENT_KEY = 'foco-jornada:sticks-protection:v1'
const PREVIOUS_KEY = 'foco-jornada:sticks-protection:previous:v1'
const RESET_ARCHIVE_PREFIX = 'personal-stock:sticks-reset-archive:'
const METADATA_KEYS = new Set([
  'personal-stock:stick-pack-planner-v1',
  'personal-stock:nicotine-awareness-v1',
  'personal-stock:nicotine-awareness-v2',
])

interface StickProtectionCore {
  version: 1
  createdAt: string
  entity: StockEntity | null
  movements: StockMovement[]
  metadata: AppMetadataRecord[]
}

interface StickProtectionSnapshot extends StickProtectionCore {
  checksum: string
}

export interface StickProtectionStatus {
  available: boolean
  valid: boolean
  createdAt?: string
  movementCount: number
  source: 'current' | 'previous' | 'none'
}

function hash(text: string): string {
  let value = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 0x01000193)
  }
  return (value >>> 0).toString(16).padStart(8, '0')
}

function normalize(core: StickProtectionCore): StickProtectionCore {
  return {
    version: 1,
    createdAt: core.createdAt,
    entity: core.entity,
    movements: core.movements,
    metadata: core.metadata,
  }
}

function serialize(core: StickProtectionCore): string {
  const normalized = normalize(core)
  return JSON.stringify({ ...normalized, checksum: hash(JSON.stringify(normalized)) })
}

function parse(text: string): StickProtectionSnapshot {
  const value = JSON.parse(text) as Partial<StickProtectionSnapshot>
  if (
    value.version !== 1
    || typeof value.createdAt !== 'string'
    || !Array.isArray(value.movements)
    || !Array.isArray(value.metadata)
    || typeof value.checksum !== 'string'
  ) {
    throw new Error('Cópia redundante de sticks inválida.')
  }

  const snapshot = value as StickProtectionSnapshot
  if (snapshot.entity && (snapshot.entity.id !== STICKS_ENTITY_ID || snapshot.entity.kind !== 'sticks')) {
    throw new Error('A cópia redundante contém uma entidade de sticks inválida.')
  }
  const core = normalize(snapshot)
  if (hash(JSON.stringify(core)) !== snapshot.checksum) {
    throw new Error('A cópia redundante de sticks falhou a verificação de integridade.')
  }

  let balance = 0n
  const ordered = [...snapshot.movements].sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id))
  ordered.forEach((movement, index) => {
    if (movement.entityId !== STICKS_ENTITY_ID) throw new Error('Movimento associado à entidade errada.')
    if (movement.sequence !== index) throw new Error('Sequência do ledger de sticks interrompida.')
    const before = BigInt(movement.balanceBeforeMinor)
    const quantity = BigInt(movement.quantityMinor)
    const after = BigInt(movement.balanceAfterMinor)
    if (before !== balance) throw new Error('Saldo anterior incoerente na cópia de sticks.')
    balance += quantity
    if (balance < 0n || after !== balance) throw new Error('Saldo posterior incoerente na cópia de sticks.')
  })

  return snapshot
}

function storageGet(key: string): string | null {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage.getItem(key)
  } catch {
    return null
  }
}

function storageSet(key: string, value: string): boolean {
  try {
    if (typeof globalThis.localStorage === 'undefined') return false
    globalThis.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function storageRemove(key: string): void {
  try {
    if (typeof globalThis.localStorage === 'undefined') return
    globalThis.localStorage.removeItem(key)
  } catch {
    // O reset continua na base de dados mesmo se o navegador bloquear localStorage.
  }
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export class StickDataProtectionService {
  constructor(private readonly db: AppDatabase) {}

  private async buildCore(): Promise<StickProtectionCore> {
    const [entity, movements, metadata] = await Promise.all([
      this.db.stockEntities.get(STICKS_ENTITY_ID),
      this.db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray(),
      this.db.metadata.toArray(),
    ])
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      entity: entity ?? null,
      movements: movements.sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id)),
      metadata: metadata.filter((item) => METADATA_KEYS.has(item.key)).sort((a, b) => a.key.localeCompare(b.key)),
    }
  }

  async sync(): Promise<StickProtectionStatus> {
    const core = await this.buildCore()
    const text = serialize(core)
    const current = storageGet(CURRENT_KEY)
    if (current && current !== text) storageSet(PREVIOUS_KEY, current)
    const available = storageSet(CURRENT_KEY, text)
    return {
      available,
      valid: available,
      createdAt: core.createdAt,
      movementCount: core.movements.length,
      source: available ? 'current' : 'none',
    }
  }

  async status(): Promise<StickProtectionStatus> {
    for (const candidate of [
      { source: 'current' as const, text: storageGet(CURRENT_KEY) },
      { source: 'previous' as const, text: storageGet(PREVIOUS_KEY) },
    ]) {
      if (!candidate.text) continue
      try {
        const snapshot = parse(candidate.text)
        return {
          available: true,
          valid: true,
          createdAt: snapshot.createdAt,
          movementCount: snapshot.movements.length,
          source: candidate.source,
        }
      } catch {
        // tenta a geração anterior
      }
    }
    return { available: false, valid: false, movementCount: 0, source: 'none' }
  }

  async recoverIfNeeded(): Promise<boolean> {
    const existing = await this.db.stockEntities.get(STICKS_ENTITY_ID)
    if (existing) {
      await this.sync()
      return false
    }

    for (const text of [storageGet(CURRENT_KEY), storageGet(PREVIOUS_KEY)]) {
      if (!text) continue
      try {
        const snapshot = parse(text)
        if (!snapshot.entity) continue

        const localMetadata = new Map((await this.db.metadata.toArray()).map((item) => [item.key, item]))
        await this.db.transaction(
          'rw',
          [this.db.stockEntities, this.db.stockMovements, this.db.metadata],
          async () => {
            await this.db.stockEntities.add(snapshot.entity as StockEntity)
            for (const movement of snapshot.movements) {
              const existingMovement = await this.db.stockMovements.get(movement.id)
              if (!existingMovement) await this.db.stockMovements.add(movement)
              else if (!same(existingMovement, movement)) throw new Error('Conflito num movimento de sticks.')
            }
            for (const item of snapshot.metadata) {
              const local = localMetadata.get(item.key)
              if (!local || item.updatedAt > local.updatedAt) await this.db.metadata.put(item)
            }
          },
        )
        await this.sync()
        return true
      } catch {
        // tenta a geração anterior
      }
    }
    return false
  }

  async archiveAndReset(): Promise<{ archiveKey: string | null; archivedMovementCount: number }> {
    const core = await this.buildCore()
    const archiveText = serialize(core)
    const archivedMovementCount = core.movements.length
    const archiveKey = core.entity || core.movements.length || core.metadata.length
      ? `${RESET_ARCHIVE_PREFIX}${new Date().toISOString()}`
      : null

    await this.db.transaction(
      'rw',
      [this.db.stockEntities, this.db.stockMovements, this.db.metadata],
      async () => {
        if (archiveKey) {
          await this.db.metadata.put({
            key: archiveKey,
            value: archiveText,
            updatedAt: new Date().toISOString(),
          })
        }

        await this.db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).delete()
        await this.db.stockEntities.delete(STICKS_ENTITY_ID)

        for (const key of METADATA_KEYS) {
          await this.db.metadata.delete(key)
        }
      },
    )

    storageRemove(CURRENT_KEY)
    storageRemove(PREVIOUS_KEY)
    await this.sync()

    return { archiveKey, archivedMovementCount }
  }
}
