import type { Activity } from '../../domain/activities/Activity'
import type { BreakRecord } from '../../domain/breaks/BreakRecord'
import type { CoffeeRecord } from '../../domain/coffee/CoffeeRecord'
import type { FocusSession } from '../../domain/focus/FocusSession'
import type { Journey } from '../../domain/journey/Journey'
import type {
  MedicationDoseEvent,
  MedicationSchedule,
  StockEntity,
  StockMovement,
} from '../../domain/personalStock/models'
import { SecurityProfileStore, type SecurityProfile } from '../../security/profileStore'
import type { SecureStorageBackend } from '../../security/secureStorage'
import type { SecuritySession } from '../../security/SecurityManager'
import {
  EncryptedVaultStore,
  type EncryptedVaultRecord,
} from '../../security/vaultStore'

export interface AppMetadataRecord {
  key: string
  value: string
  updatedAt: string
}

export interface AppDatabaseTables {
  metadata: AppMetadataRecord[]
  journeys: Journey[]
  breaks: BreakRecord[]
  activities: Activity[]
  focusSessions: FocusSession[]
  coffeeRecords: CoffeeRecord[]
  stockEntities: StockEntity[]
  stockMovements: StockMovement[]
  medicationSchedules: MedicationSchedule[]
  medicationDoseEvents: MedicationDoseEvent[]
}

export interface AppDatabaseSnapshot {
  schemaVersion: 1
  tables: AppDatabaseTables
  secureStorage: Record<string, string>
}

export interface SecureBackupPackage {
  format: 'foco-jornada-secure-backup'
  schemaVersion: 1
  exportedAt: string
  profile: SecurityProfile
  vault: EncryptedVaultRecord
}

type TableName = keyof AppDatabaseTables
type KeyField = 'id' | 'key'
type IndexableRecord = Record<string, unknown>

const STICKS_ENTITY_ID = 'stock:sticks:glo'
const MAX_SAFE_STICKS = BigInt(Number.MAX_SAFE_INTEGER)
const testSnapshots = new Map<string, AppDatabaseSnapshot>()

function emptySnapshot(): AppDatabaseSnapshot {
  return {
    schemaVersion: 1,
    tables: {
      metadata: [],
      journeys: [],
      breaks: [],
      activities: [],
      focusSessions: [],
      coffeeRecords: [],
      stockEntities: [],
      stockMovements: [],
      medicationSchedules: [],
      medicationDoseEvents: [],
    },
    secureStorage: {},
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0
  if (left === undefined || left === null) return -1
  if (right === undefined || right === null) return 1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right))
}

function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  return String(left) === String(right)
}

function stockMovementCreatingValidator(value: StockMovement): void {
  if (value.entityId !== STICKS_ENTITY_ID) return
  const before = BigInt(value.balanceBeforeMinor)
  const quantity = BigInt(value.quantityMinor)
  const after = BigInt(value.balanceAfterMinor)
  if (before < 0n || after < 0n) throw new Error('Stock de sticks não pode ser negativo.')
  if (before + quantity !== after) throw new Error('INCONSISTÊNCIA: movimento de sticks inválido.')
  if (after > MAX_SAFE_STICKS) throw new Error('Stock de sticks excede o limite seguro suportado.')
}

class VaultCollection<T extends object> {
  constructor(
    private readonly table: VaultTable<T>,
    private readonly predicate: (value: T) => boolean,
  ) {}

  filter(predicate: (value: T) => boolean): VaultCollection<T> {
    return new VaultCollection(this.table, (value) => this.predicate(value) && predicate(value))
  }

  async toArray(): Promise<T[]> {
    const all = await this.table.toArray()
    return all.filter(this.predicate)
  }

  async first(): Promise<T | undefined> {
    return (await this.toArray())[0]
  }

  async count(): Promise<number> {
    return (await this.toArray()).length
  }

  async sortBy(field: string): Promise<T[]> {
    const values = await this.toArray()
    return values.sort((left, right) => compareValues(
      (left as IndexableRecord)[field],
      (right as IndexableRecord)[field],
    ))
  }

  async delete(): Promise<number> {
    const values = await this.toArray()
    for (const value of values) await this.table.delete(this.table.keyOf(value))
    return values.length
  }
}

class VaultWhereClause<T extends object> {
  constructor(
    private readonly table: VaultTable<T>,
    private readonly field: string,
  ) {}

  equals(value: unknown): VaultCollection<T> {
    return new VaultCollection(
      this.table,
      (record) => sameValue((record as IndexableRecord)[this.field], value),
    )
  }
}

export class VaultTable<T extends object> {
  constructor(
    private readonly database: AppDatabase,
    private readonly tableName: TableName,
    private readonly keyField: KeyField,
    private readonly uniqueIndexes: string[] = [],
    private readonly creatingValidator?: (value: T) => void,
  ) {}

  keyOf(value: T): string {
    const key = (value as IndexableRecord)[this.keyField]
    if (typeof key !== 'string' || !key) throw new Error(`Registo sem chave em ${this.tableName}.`)
    return key
  }

  private async records(): Promise<T[]> {
    await this.database.ensureReady()
    return this.database.tableRecords<T>(this.tableName)
  }

  private async assertUnique(value: T, replacingKey?: string): Promise<void> {
    if (!this.uniqueIndexes.length) return
    const records = await this.records()
    for (const index of this.uniqueIndexes) {
      const candidate = (value as IndexableRecord)[index]
      if (candidate === undefined || candidate === null) continue
      const duplicate = records.find((item) => (
        this.keyOf(item) !== replacingKey
        && sameValue((item as IndexableRecord)[index], candidate)
      ))
      if (duplicate) throw new Error(`Valor duplicado no índice ${index} de ${this.tableName}.`)
    }
  }

  async get(key: string): Promise<T | undefined> {
    const records = await this.records()
    const value = records.find((item) => this.keyOf(item) === key)
    return value ? clone(value) : undefined
  }

  async add(value: T): Promise<string> {
    return this.database.write(async () => {
      const key = this.keyOf(value)
      if (await this.get(key)) throw new Error(`A chave ${key} já existe em ${this.tableName}.`)
      await this.assertUnique(value)
      this.creatingValidator?.(value)
      this.database.tableRecords<T>(this.tableName).push(clone(value))
      return key
    })
  }

  async put(value: T): Promise<string> {
    return this.database.write(async () => {
      const key = this.keyOf(value)
      await this.assertUnique(value, key)
      const records = this.database.tableRecords<T>(this.tableName)
      const index = records.findIndex((item) => this.keyOf(item) === key)
      if (index < 0) {
        this.creatingValidator?.(value)
        records.push(clone(value))
      } else {
        records[index] = clone(value)
      }
      return key
    })
  }

  async update(key: string, changes: Partial<T>): Promise<number> {
    return this.database.write(async () => {
      const records = this.database.tableRecords<T>(this.tableName)
      const index = records.findIndex((item) => this.keyOf(item) === key)
      if (index < 0) return 0
      const next = { ...records[index], ...clone(changes) } as T
      await this.assertUnique(next, key)
      records[index] = next
      return 1
    })
  }

  async delete(key: string): Promise<void> {
    await this.database.write(async () => {
      const records = this.database.tableRecords<T>(this.tableName)
      const index = records.findIndex((item) => this.keyOf(item) === key)
      if (index >= 0) records.splice(index, 1)
    })
  }

  async clear(): Promise<void> {
    await this.database.write(async () => {
      this.database.replaceTable(this.tableName, [])
    })
  }

  async count(): Promise<number> {
    return (await this.records()).length
  }

  async toArray(): Promise<T[]> {
    return clone(await this.records())
  }

  async bulkPut(values: T[]): Promise<void> {
    await this.database.write(async () => {
      for (const value of values) {
        const key = this.keyOf(value)
        await this.assertUnique(value, key)
        const records = this.database.tableRecords<T>(this.tableName)
        const index = records.findIndex((item) => this.keyOf(item) === key)
        if (index < 0) {
          this.creatingValidator?.(value)
          records.push(clone(value))
        } else {
          records[index] = clone(value)
        }
      }
    })
  }

  where(field: string): VaultWhereClause<T> {
    return new VaultWhereClause(this, field)
  }
}

export class AppDatabase implements SecureStorageBackend {
  readonly name: string
  readonly metadata: VaultTable<AppMetadataRecord>
  readonly journeys: VaultTable<Journey>
  readonly breaks: VaultTable<BreakRecord>
  readonly activities: VaultTable<Activity>
  readonly focusSessions: VaultTable<FocusSession>
  readonly coffeeRecords: VaultTable<CoffeeRecord>
  readonly stockEntities: VaultTable<StockEntity>
  readonly stockMovements: VaultTable<StockMovement>
  readonly medicationSchedules: VaultTable<MedicationSchedule>
  readonly medicationDoseEvents: VaultTable<MedicationDoseEvent>

  private snapshot = emptySnapshot()
  private readonly vaultStore = new EncryptedVaultStore()
  private readonly profileStore = new SecurityProfileStore()
  private session: SecuritySession | null
  private revision = 0
  private readyPromise: Promise<void>
  private transactionQueue: Promise<void> = Promise.resolve()
  private transactionActive = false
  private closed = false

  constructor(nameOrSession: string | SecuritySession = `foco-jornada-test-${crypto.randomUUID()}`) {
    this.session = typeof nameOrSession === 'string' ? null : nameOrSession
    this.name = typeof nameOrSession === 'string'
      ? nameOrSession
      : `foco-jornada-secure-${nameOrSession.profile.id}`

    this.metadata = new VaultTable(this, 'metadata', 'key')
    this.journeys = new VaultTable(this, 'journeys', 'id')
    this.breaks = new VaultTable(this, 'breaks', 'id')
    this.activities = new VaultTable(this, 'activities', 'id')
    this.focusSessions = new VaultTable(this, 'focusSessions', 'id')
    this.coffeeRecords = new VaultTable(this, 'coffeeRecords', 'id')
    this.stockEntities = new VaultTable(this, 'stockEntities', 'id')
    this.stockMovements = new VaultTable(
      this,
      'stockMovements',
      'id',
      ['operationId'],
      stockMovementCreatingValidator,
    )
    this.medicationSchedules = new VaultTable(this, 'medicationSchedules', 'id')
    this.medicationDoseEvents = new VaultTable(
      this,
      'medicationDoseEvents',
      'id',
      ['operationId'],
    )

    this.readyPromise = this.load()
  }

  get isSecure(): boolean {
    return Boolean(this.session)
  }

  get securityProfile(): SecurityProfile | null {
    return this.session?.profile ?? null
  }

  private async load(): Promise<void> {
    if (!this.session) {
      this.snapshot = clone(testSnapshots.get(this.name) ?? emptySnapshot())
      return
    }

    const loaded = await this.vaultStore.load<AppDatabaseSnapshot>(
      this.session.profile.id,
      this.session.dataKey,
    )
    if (!loaded) {
      this.snapshot = emptySnapshot()
      this.revision = await this.vaultStore.save(
        this.session.profile.id,
        this.session.dataKey,
        this.snapshot,
        0,
      )
      return
    }
    if (loaded.value.schemaVersion !== 1) throw new Error('Versão do cofre local não suportada.')
    this.snapshot = loaded.value
    this.revision = loaded.revision
  }

  async ensureReady(): Promise<void> {
    if (this.closed) throw new Error('A base de dados está bloqueada.')
    await this.readyPromise
  }

  tableRecords<T extends object>(name: TableName): T[] {
    return this.snapshot.tables[name] as unknown as T[]
  }

  replaceTable(name: TableName, values: object[]): void {
    ;(this.snapshot.tables as unknown as Record<TableName, object[]>)[name] = values
  }

  private async persist(): Promise<void> {
    if (!this.session) {
      testSnapshots.set(this.name, clone(this.snapshot))
      return
    }
    this.revision = await this.vaultStore.save(
      this.session.profile.id,
      this.session.dataKey,
      this.snapshot,
      this.revision,
    )
  }

  async write<T>(operation: () => Promise<T> | T): Promise<T> {
    await this.ensureReady()
    if (this.transactionActive) return operation()

    return this.transaction('rw', async () => operation())
  }

  async transaction<T, TArgs extends readonly unknown[]>(
    _mode: string,
    ...args: [...TArgs, () => Promise<T>]
  ): Promise<T> {
    const callback = args[args.length - 1] as () => Promise<T>
    let resolveResult!: (value: T | PromiseLike<T>) => void
    let rejectResult!: (reason?: unknown) => void
    const result = new Promise<T>((resolve, reject) => {
      resolveResult = resolve
      rejectResult = reject
    })

    const queued = this.transactionQueue.then(async () => {
      await this.ensureReady()
      const before = clone(this.snapshot)
      this.transactionActive = true
      try {
        const value = await callback()
        await this.persist()
        resolveResult(value)
      } catch (error) {
        this.snapshot = before
        rejectResult(error)
      } finally {
        this.transactionActive = false
      }
    })

    this.transactionQueue = queued.catch(() => undefined)
    return result
  }

  getStorageItem(key: string): string | null {
    return this.snapshot.secureStorage[key] ?? null
  }

  setStorageItem(key: string, value: string): void {
    this.snapshot.secureStorage[key] = value
    void this.transaction('rw', async () => undefined)
  }

  removeStorageItem(key: string): void {
    delete this.snapshot.secureStorage[key]
    void this.transaction('rw', async () => undefined)
  }

  async flushStorage(): Promise<void> {
    await this.transactionQueue
  }

  async importLegacy(
    tables: AppDatabaseTables,
    storage: Record<string, string>,
  ): Promise<Record<TableName, number>> {
    await this.ensureReady()
    const before = clone(this.snapshot)
    try {
      this.snapshot = {
        schemaVersion: 1,
        tables: clone(tables),
        secureStorage: { ...storage },
      }
      await this.persist()
      const counts = await this.counts()
      for (const name of Object.keys(tables) as TableName[]) {
        if (counts[name] !== tables[name].length) {
          throw new Error(`Falha de integridade durante a migração de ${name}.`)
        }
      }
      return counts
    } catch (error) {
      this.snapshot = before
      throw error
    }
  }

  async counts(): Promise<Record<TableName, number>> {
    await this.ensureReady()
    return {
      metadata: this.snapshot.tables.metadata.length,
      journeys: this.snapshot.tables.journeys.length,
      breaks: this.snapshot.tables.breaks.length,
      activities: this.snapshot.tables.activities.length,
      focusSessions: this.snapshot.tables.focusSessions.length,
      coffeeRecords: this.snapshot.tables.coffeeRecords.length,
      stockEntities: this.snapshot.tables.stockEntities.length,
      stockMovements: this.snapshot.tables.stockMovements.length,
      medicationSchedules: this.snapshot.tables.medicationSchedules.length,
      medicationDoseEvents: this.snapshot.tables.medicationDoseEvents.length,
    }
  }

  async exportSecureBackupText(): Promise<string> {
    if (!this.session) throw new Error('Cópia segura indisponível fora de um perfil protegido.')
    await this.flushStorage()
    const vault = await this.vaultStore.readRecord(this.session.profile.id)
    if (!vault) throw new Error('O cofre local não foi encontrado.')
    const currentProfile = await this.profileStore.get(this.session.profile.id)
    if (!currentProfile) throw new Error('O perfil de segurança atual não foi encontrado.')

    const payload: SecureBackupPackage = {
      format: 'foco-jornada-secure-backup',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        ...currentProfile,
        failedAttempts: 0,
        lockedUntil: undefined,
      },
      vault,
    }
    return JSON.stringify(payload, null, 2)
  }

  async restoreSecureBackupText(text: string): Promise<Record<TableName, number>> {
    if (!this.session) throw new Error('Abre primeiro o perfil protegido.')
    let parsed: SecureBackupPackage
    try {
      parsed = JSON.parse(text) as SecureBackupPackage
    } catch {
      throw new Error('Ficheiro de cópia inválido.')
    }
    if (parsed.format !== 'foco-jornada-secure-backup' || parsed.schemaVersion !== 1) {
      throw new Error('Este ficheiro não é uma cópia segura do Foco Jornada.')
    }
    if (parsed.profile.id !== this.session.profile.id || parsed.vault.profileId !== this.session.profile.id) {
      throw new Error('A cópia pertence a outro perfil. Usa o fluxo de recuperação no ecrã de acesso.')
    }

    let candidate: { value: AppDatabaseSnapshot; revision: number }
    try {
      candidate = await this.vaultStore.decryptRecord<AppDatabaseSnapshot>(
        this.session.profile.id,
        this.session.dataKey,
        parsed.vault,
      )
    } catch {
      throw new Error('A cópia não pôde ser desencriptada com este perfil ou está corrompida.')
    }
    if (candidate.value.schemaVersion !== 1) {
      throw new Error('A versão dos dados desta cópia não é suportada.')
    }

    // A cópia só substitui o cofre persistente depois de ser desencriptada e validada em memória.
    await this.vaultStore.replace(this.session.profile.id, parsed.vault)
    this.snapshot = candidate.value
    this.revision = candidate.revision
    return this.counts()
  }

  close(): void {
    this.closed = true
    this.snapshot = emptySnapshot()
    this.session = null
  }

  async delete(): Promise<void> {
    const profileId = this.session?.profile.id
    if (profileId) {
      await this.vaultStore.delete(profileId)
    } else {
      testSnapshots.delete(this.name)
    }
    this.snapshot = emptySnapshot()
    this.closed = true
    this.session = null
  }
}
