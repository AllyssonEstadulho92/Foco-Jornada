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
import type { AppDatabase, AppMetadataRecord } from '../../infrastructure/database/appDatabase'

export const BACKUP_FORMAT = 'foco-jornada-backup'
export const BACKUP_SCHEMA_VERSION = 1
export const BACKUP_APP_VERSION = '0.1.0'
export const BACKUP_DATABASE_VERSION = 7

export interface AppBackupTables {
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

export interface AppBackupPayload {
  format: typeof BACKUP_FORMAT
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  appVersion: string
  databaseVersion: number
  exportedAt: string
  tables: AppBackupTables
}

export interface BackupRestoreSummary {
  restoredAt: string
  tableCounts: Record<keyof AppBackupTables, number>
}

const TABLE_NAMES: Array<keyof AppBackupTables> = [
  'metadata',
  'journeys',
  'breaks',
  'activities',
  'focusSessions',
  'coffeeRecords',
  'stockEntities',
  'stockMovements',
  'medicationSchedules',
  'medicationDoseEvents',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) throw new Error(`Cópia inválida: ${label}.`)
  return value
}

function integerString(value: unknown, label: string): bigint {
  const text = requiredString(value, label)
  try {
    return BigInt(text)
  } catch {
    throw new Error(`Cópia inválida: ${label} não é um número inteiro.`)
  }
}

function ensureUnique(values: string[], label: string) {
  const seen = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Cópia inválida: ${label} duplicado (${value}).`)
    seen.add(value)
  }
}

function validateStockBackup(payload: AppBackupPayload) {
  const entities = payload.tables.stockEntities
  const movements = payload.tables.stockMovements
  const schedules = payload.tables.medicationSchedules
  const events = payload.tables.medicationDoseEvents

  for (const entity of entities) {
    if (!isRecord(entity)) throw new Error('Cópia inválida: entidade de stock malformada.')
    requiredString(entity.id, 'id da entidade de stock')
    if (entity.kind !== 'sticks' && entity.kind !== 'medication') {
      throw new Error('Cópia inválida: tipo de entidade de stock desconhecido.')
    }
  }
  ensureUnique(entities.map((entity) => entity.id), 'id de entidade de stock')
  const entityById = new Map(entities.map((entity) => [entity.id, entity]))

  for (const movement of movements) {
    if (!isRecord(movement)) throw new Error('Cópia inválida: movimento de stock malformado.')
    requiredString(movement.id, 'id do movimento')
    requiredString(movement.operationId, 'operationId do movimento')
    requiredString(movement.entityId, 'entidade do movimento')
    if (!entityById.has(movement.entityId)) {
      throw new Error(`Cópia inválida: movimento ${movement.id} refere uma entidade inexistente.`)
    }
    if (!['initial_stock', 'consumption', 'restock', 'correction'].includes(movement.type)) {
      throw new Error(`Cópia inválida: tipo do movimento ${movement.id} desconhecido.`)
    }
    if (!Number.isSafeInteger(movement.sequence) || movement.sequence < 0) {
      throw new Error(`Cópia inválida: sequência do movimento ${movement.id}.`)
    }
    integerString(movement.quantityMinor, `quantidade do movimento ${movement.id}`)
    integerString(movement.balanceBeforeMinor, `saldo anterior do movimento ${movement.id}`)
    integerString(movement.balanceAfterMinor, `saldo posterior do movimento ${movement.id}`)
  }
  ensureUnique(movements.map((movement) => movement.id), 'id de movimento')
  ensureUnique(movements.map((movement) => movement.operationId), 'operationId de movimento')
  const movementById = new Map(movements.map((movement) => [movement.id, movement]))

  const movementsByEntity = new Map<string, StockMovement[]>()
  for (const movement of movements) {
    const group = movementsByEntity.get(movement.entityId) ?? []
    group.push(movement)
    movementsByEntity.set(movement.entityId, group)
  }

  for (const [entityId, group] of movementsByEntity) {
    const ordered = [...group].sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
    let balance = 0n
    ordered.forEach((movement, index) => {
      if (movement.sequence !== index) {
        throw new Error(`Cópia inválida: sequência do ledger interrompida em ${entityId}.`)
      }
      const quantity = integerString(movement.quantityMinor, `quantidade do movimento ${movement.id}`)
      const before = integerString(movement.balanceBeforeMinor, `saldo anterior do movimento ${movement.id}`)
      const after = integerString(movement.balanceAfterMinor, `saldo posterior do movimento ${movement.id}`)
      if (before !== balance) throw new Error(`Cópia inválida: saldo anterior incoerente em ${movement.id}.`)
      if (movement.type === 'initial_stock' && (index !== 0 || quantity <= 0n)) {
        throw new Error(`Cópia inválida: stock inicial incoerente em ${movement.id}.`)
      }
      if (movement.type === 'restock' && quantity <= 0n) {
        throw new Error(`Cópia inválida: reposição não positiva em ${movement.id}.`)
      }
      if (movement.type === 'consumption' && quantity >= 0n) {
        throw new Error(`Cópia inválida: consumo não negativo em ${movement.id}.`)
      }
      if (movement.type === 'correction' && quantity === 0n) {
        throw new Error(`Cópia inválida: correção nula em ${movement.id}.`)
      }
      if (movement.type !== 'correction' && movement.correctionOf) {
        throw new Error(`Cópia inválida: correctionOf indevido em ${movement.id}.`)
      }
      balance += quantity
      if (balance < 0n) throw new Error(`Cópia inválida: ledger negativo em ${movement.id}.`)
      if (after !== balance) throw new Error(`Cópia inválida: saldo posterior incoerente em ${movement.id}.`)
    })
  }

  for (const movement of movements) {
    if (!movement.correctionOf) continue
    const target = movementById.get(movement.correctionOf)
    if (!target || target.entityId !== movement.entityId) {
      throw new Error(`Cópia inválida: correção ${movement.id} refere um movimento inexistente.`)
    }
  }

  for (const schedule of schedules) {
    if (!isRecord(schedule)) throw new Error('Cópia inválida: horário de medicação malformado.')
    requiredString(schedule.id, 'id do horário')
    requiredString(schedule.medicationId, 'medicamento do horário')
    const medication = entityById.get(schedule.medicationId)
    if (!medication || medication.kind !== 'medication') {
      throw new Error(`Cópia inválida: horário ${schedule.id} refere um medicamento inexistente.`)
    }
    if (integerString(schedule.quantityMinor, `quantidade do horário ${schedule.id}`) <= 0n) {
      throw new Error(`Cópia inválida: quantidade não positiva no horário ${schedule.id}.`)
    }
  }
  ensureUnique(schedules.map((schedule) => schedule.id), 'id de horário')
  const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]))

  for (const event of events) {
    if (!isRecord(event)) throw new Error('Cópia inválida: evento de toma malformado.')
    requiredString(event.id, 'id do evento de toma')
    requiredString(event.operationId, 'operationId do evento de toma')
    requiredString(event.occurrenceKey, 'ocorrência do evento de toma')
    requiredString(event.medicationId, 'medicamento do evento de toma')
    requiredString(event.scheduleId, 'horário do evento de toma')
    const medication = entityById.get(event.medicationId)
    const schedule = scheduleById.get(event.scheduleId)
    if (!medication || medication.kind !== 'medication' || !schedule || schedule.medicationId !== event.medicationId) {
      throw new Error(`Cópia inválida: evento ${event.id} tem referências de medicação incoerentes.`)
    }
    if (!['taken', 'not_taken', 'postponed', 'corrected'].includes(event.status)) {
      throw new Error(`Cópia inválida: estado desconhecido no evento ${event.id}.`)
    }
    const quantity = integerString(event.quantityMinor, `quantidade do evento ${event.id}`)
    if (quantity <= 0n) throw new Error(`Cópia inválida: quantidade não positiva no evento ${event.id}.`)

    if (event.status === 'taken') {
      const stockMovementId = requiredString(event.stockMovementId, `movimento de stock do evento ${event.id}`)
      const stockMovement = movementById.get(stockMovementId)
      if (
        !stockMovement
        || stockMovement.entityId !== event.medicationId
        || stockMovement.type !== 'consumption'
        || stockMovement.operationId !== event.operationId
        || integerString(stockMovement.quantityMinor, `quantidade do movimento ${stockMovement.id}`) !== -quantity
      ) {
        throw new Error(`Cópia inválida: consumo associado ao evento ${event.id} é incoerente.`)
      }
    }

    if ((event.status === 'not_taken' || event.status === 'postponed') && event.stockMovementId) {
      throw new Error(`Cópia inválida: evento ${event.id} não deve alterar stock.`)
    }

    if (event.status === 'corrected' && !event.correctionOf) {
      throw new Error(`Cópia inválida: evento corrigido ${event.id} não identifica o evento original.`)
    }
    if (event.status !== 'corrected' && event.correctionOf) {
      throw new Error(`Cópia inválida: correctionOf indevido no evento ${event.id}.`)
    }
  }
  ensureUnique(events.map((event) => event.id), 'id de evento de toma')
  ensureUnique(events.map((event) => event.operationId), 'operationId de evento de toma')
  const eventById = new Map(events.map((event) => [event.id, event]))

  for (const event of events) {
    if (event.status !== 'corrected' || !event.correctionOf) continue
    const target = eventById.get(event.correctionOf)
    if (!target || target.occurrenceKey !== event.occurrenceKey || target.medicationId !== event.medicationId) {
      throw new Error(`Cópia inválida: correção do evento ${event.id} refere uma toma inexistente.`)
    }
    if (event.stockMovementId) {
      const movement = movementById.get(event.stockMovementId)
      if (!movement || movement.type !== 'correction' || movement.entityId !== event.medicationId) {
        throw new Error(`Cópia inválida: movimento de correção do evento ${event.id} é incoerente.`)
      }
    }
  }
}

function parseBackup(text: string): AppBackupPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new Error('A cópia de segurança não contém JSON válido.')
  }

  if (!isRecord(parsed)) throw new Error('Formato de cópia de segurança inválido.')
  if (parsed.format !== BACKUP_FORMAT) throw new Error('Este ficheiro não é uma cópia do Foco Jornada.')
  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('A versão desta cópia de segurança não é suportada por esta aplicação.')
  }
  if (typeof parsed.appVersion !== 'string' || !parsed.appVersion) {
    throw new Error('A cópia de segurança não identifica a versão da aplicação.')
  }
  if (typeof parsed.databaseVersion !== 'number' || !Number.isSafeInteger(parsed.databaseVersion)) {
    throw new Error('A cópia de segurança não identifica uma versão de base de dados válida.')
  }
  if (parsed.databaseVersion > BACKUP_DATABASE_VERSION) {
    throw new Error('A cópia foi criada por uma versão de base de dados mais recente.')
  }
  if (typeof parsed.exportedAt !== 'string' || Number.isNaN(Date.parse(parsed.exportedAt))) {
    throw new Error('A data da cópia de segurança é inválida.')
  }
  if (!isRecord(parsed.tables)) throw new Error('A cópia de segurança não contém as tabelas esperadas.')

  for (const tableName of TABLE_NAMES) {
    if (!Array.isArray(parsed.tables[tableName])) {
      throw new Error(`A tabela ${tableName} está em falta ou é inválida.`)
    }
  }

  const payload = parsed as unknown as AppBackupPayload
  validateStockBackup(payload)
  return payload
}


function mergeAppendOnlyById<T>(
  incoming: T[],
  local: T[],
  idOf: (item: T) => string,
  label: string,
): T[] {
  const merged = [...incoming]
  const byId = new Map(incoming.map((item) => [idOf(item), item]))
  for (const item of local) {
    const id = idOf(item)
    const existing = byId.get(id)
    if (!existing) {
      merged.push(item)
      byId.set(id, item)
      continue
    }
    if (JSON.stringify(existing) !== JSON.stringify(item)) {
      throw new Error(`Restauro protegido recusado: ${label} ${id} tem conteúdo diferente entre a cópia e os dados locais.`)
    }
  }
  return merged
}

function mergeStockEntities(incoming: StockEntity[], local: StockEntity[]): StockEntity[] {
  const merged = [...incoming]
  const byId = new Map(incoming.map((item) => [item.id, item]))

  for (const item of local) {
    const existing = byId.get(item.id)
    if (!existing) {
      merged.push(item)
      byId.set(item.id, item)
      continue
    }

    const immutableFieldsMatch =
      existing.kind === item.kind
      && existing.name === item.name
      && existing.unit === item.unit
      && existing.dosage === item.dosage
      && existing.timezone === item.timezone
      && existing.startDate === item.startDate
      && existing.createdAt === item.createdAt

    if (!immutableFieldsMatch) {
      throw new Error(`Restauro protegido recusado: a entidade de stock ${item.id} tem identidade diferente.`)
    }

    const incomingPhysicalAt = existing.lastPhysicalCountAt ?? ''
    const localPhysicalAt = item.lastPhysicalCountAt ?? ''
    const preferred = localPhysicalAt > incomingPhysicalAt ? item : existing
    const index = merged.findIndex((candidate) => candidate.id === item.id)
    if (index >= 0) merged[index] = preferred
    byId.set(item.id, preferred)
  }

  return merged
}

function mergeProtectedMetadata(incoming: AppMetadataRecord[], local: AppMetadataRecord[]): AppMetadataRecord[] {
  const merged = [...incoming]
  const byKey = new Map(incoming.map((item) => [item.key, item]))
  for (const item of local) {
    const existing = byKey.get(item.key)
    if (!existing) {
      merged.push(item)
      byKey.set(item.key, item)
      continue
    }
    if (JSON.stringify(existing) === JSON.stringify(item)) continue

    const replaceableCurrent = item.key.startsWith('medication-protection:note-current:')
      || item.key.startsWith('medication-protection:profile-current:')
      || item.key === 'personal-stock:nicotine-awareness-v1'
      || item.key === 'personal-stock:nicotine-awareness-v2'
      || item.key === 'personal-stock:stick-pack-planner-v1'
    if (!replaceableCurrent) {
      throw new Error(`Restauro protegido recusado: o registo ${item.key} diverge da cópia.`)
    }
    const preferred = item.updatedAt > existing.updatedAt ? item : existing
    const index = merged.findIndex((candidate) => candidate.key === item.key)
    if (index >= 0) merged[index] = preferred
    byKey.set(item.key, preferred)
  }
  return merged
}

export class AppBackupService {
  constructor(private readonly db: AppDatabase) {}

  async createPayload(): Promise<AppBackupPayload> {
    const [
      metadata,
      journeys,
      breaks,
      activities,
      focusSessions,
      coffeeRecords,
      stockEntities,
      stockMovements,
      medicationSchedules,
      medicationDoseEvents,
    ] = await Promise.all([
      this.db.metadata.toArray(),
      this.db.journeys.toArray(),
      this.db.breaks.toArray(),
      this.db.activities.toArray(),
      this.db.focusSessions.toArray(),
      this.db.coffeeRecords.toArray(),
      this.db.stockEntities.toArray(),
      this.db.stockMovements.toArray(),
      this.db.medicationSchedules.toArray(),
      this.db.medicationDoseEvents.toArray(),
    ])

    return {
      format: BACKUP_FORMAT,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appVersion: BACKUP_APP_VERSION,
      databaseVersion: BACKUP_DATABASE_VERSION,
      exportedAt: new Date().toISOString(),
      tables: {
        metadata,
        journeys,
        breaks,
        activities,
        focusSessions,
        coffeeRecords,
        stockEntities,
        stockMovements,
        medicationSchedules,
        medicationDoseEvents,
      },
    }
  }

  async exportText(): Promise<string> {
    return JSON.stringify(await this.createPayload(), null, 2)
  }

  async restoreFromText(text: string): Promise<BackupRestoreSummary> {
    const incomingPayload = parseBackup(text)

    const [localEntities, localMovements, localSchedules, localDoseEvents, localMetadata] = await Promise.all([
      this.db.stockEntities.toArray(),
      this.db.stockMovements.toArray(),
      this.db.medicationSchedules.toArray(),
      this.db.medicationDoseEvents.toArray(),
      this.db.metadata.toArray(),
    ])
    const localMedicationIds = new Set(
      localEntities.filter((entity) => entity.kind === 'medication').map((entity) => entity.id),
    )
    const localMedicationSchedules = localSchedules.filter((schedule) => localMedicationIds.has(schedule.medicationId))
    const localMedicationDoseEvents = localDoseEvents.filter((event) => localMedicationIds.has(event.medicationId))
    const localProtectedMetadata = localMetadata.filter((record) =>
      record.key.startsWith('medication-protection:')
      || record.key === 'personal-stock:nicotine-awareness-v1'
      || record.key === 'personal-stock:nicotine-awareness-v2'
      || record.key === 'personal-stock:stick-pack-planner-v1'
    )

    const payload: AppBackupPayload = {
      ...incomingPayload,
      tables: {
        ...incomingPayload.tables,
        metadata: mergeProtectedMetadata(incomingPayload.tables.metadata, localProtectedMetadata),
        stockEntities: mergeStockEntities(
          incomingPayload.tables.stockEntities,
          localEntities,
        ),
        stockMovements: mergeAppendOnlyById(
          incomingPayload.tables.stockMovements,
          localMovements,
          (item) => item.id,
          'movimento de stock',
        ),
        medicationSchedules: mergeAppendOnlyById(
          incomingPayload.tables.medicationSchedules,
          localMedicationSchedules,
          (item) => item.id,
          'horário de medicação',
        ),
        medicationDoseEvents: mergeAppendOnlyById(
          incomingPayload.tables.medicationDoseEvents,
          localMedicationDoseEvents,
          (item) => item.id,
          'evento de toma',
        ),
      },
    }
    validateStockBackup(payload)

    await this.db.transaction(
      'rw',
      [
        this.db.metadata,
        this.db.journeys,
        this.db.breaks,
        this.db.activities,
        this.db.focusSessions,
        this.db.coffeeRecords,
        this.db.stockEntities,
        this.db.stockMovements,
        this.db.medicationSchedules,
        this.db.medicationDoseEvents,
      ],
      async () => {
        await this.db.medicationDoseEvents.clear()
        await this.db.medicationSchedules.clear()
        await this.db.stockMovements.clear()
        await this.db.stockEntities.clear()
        await this.db.coffeeRecords.clear()
        await this.db.focusSessions.clear()
        await this.db.activities.clear()
        await this.db.breaks.clear()
        await this.db.journeys.clear()
        await this.db.metadata.clear()

        await this.db.metadata.bulkPut(payload.tables.metadata)
        await this.db.journeys.bulkPut(payload.tables.journeys)
        await this.db.breaks.bulkPut(payload.tables.breaks)
        await this.db.activities.bulkPut(payload.tables.activities)
        await this.db.focusSessions.bulkPut(payload.tables.focusSessions)
        await this.db.coffeeRecords.bulkPut(payload.tables.coffeeRecords)
        await this.db.stockEntities.bulkPut(payload.tables.stockEntities)
        await this.db.stockMovements.bulkPut(payload.tables.stockMovements)
        await this.db.medicationSchedules.bulkPut(payload.tables.medicationSchedules)
        await this.db.medicationDoseEvents.bulkPut(payload.tables.medicationDoseEvents)
      },
    )

    return {
      restoredAt: new Date().toISOString(),
      tableCounts: Object.fromEntries(
        TABLE_NAMES.map((tableName) => [tableName, payload.tables[tableName].length]),
      ) as BackupRestoreSummary['tableCounts'],
    }
  }
}
