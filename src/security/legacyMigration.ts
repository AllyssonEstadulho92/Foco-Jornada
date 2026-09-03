import Dexie, { type Table } from 'dexie'
import type { Activity } from '../domain/activities/Activity'
import type { BreakRecord } from '../domain/breaks/BreakRecord'
import type { CoffeeRecord } from '../domain/coffee/CoffeeRecord'
import type { FocusSession } from '../domain/focus/FocusSession'
import type { Journey } from '../domain/journey/Journey'
import type {
  MedicationDoseEvent,
  MedicationSchedule,
  StockEntity,
  StockMovement,
} from '../domain/personalStock/models'
import type {
  AppDatabase,
  AppDatabaseTables,
  AppMetadataRecord,
} from '../infrastructure/database/appDatabase'

const LEGACY_DB_NAME = 'foco-jornada'
const EXCLUDED_LOCAL_KEYS = new Set([
  'foco-jornada-ui-v2',
  'foco-jornada-security-active-profile-v1',
])

class LegacyAppDatabase extends Dexie {
  metadata!: Table<AppMetadataRecord, string>
  journeys!: Table<Journey, string>
  breaks!: Table<BreakRecord, string>
  activities!: Table<Activity, string>
  focusSessions!: Table<FocusSession, string>
  coffeeRecords!: Table<CoffeeRecord, string>
  stockEntities!: Table<StockEntity, string>
  stockMovements!: Table<StockMovement, string>
  medicationSchedules!: Table<MedicationSchedule, string>
  medicationDoseEvents!: Table<MedicationDoseEvent, string>

  constructor() {
    super(LEGACY_DB_NAME)
    this.version(7).stores({
      metadata: '&key,updatedAt',
      journeys: '&id,date,status,startedAt,endedAt,updatedAt',
      breaks: '&id,journeyId,status,startedAt,endedAt',
      activities: '&id,journeyId,status,createdAt,startedAt,endedAt,updatedAt',
      focusSessions:
        '&id,journeyId,activityId,mode,segmentType,status,cycle,createdAt,startedAt,endedAt,updatedAt',
      coffeeRecords: '&id,date,journeyId,createdAt',
      stockEntities: '&id,kind,createdAt',
      stockMovements: '&id,&operationId,entityId,[entityId+sequence],type,effectiveAt,createdAt,correctionOf',
      medicationSchedules: '&id,medicationId,[medicationId+order],effectiveFrom,effectiveUntil,createdAt',
      medicationDoseEvents: '&id,&operationId,occurrenceKey,medicationId,scheduleId,status,scheduledAt,createdAt',
    })
  }
}

export interface LegacyMigrationResult {
  migrated: boolean
  tableRecords: number
  storageRecords: number
}

function legacyStorageSnapshot(): Record<string, string> {
  const values: Record<string, string> = {}
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key || EXCLUDED_LOCAL_KEYS.has(key) || !key.startsWith('foco-jornada')) continue
      const value = localStorage.getItem(key)
      if (value !== null) values[key] = value
    }
  } catch {
    // A migração da base de dados continua mesmo que o navegador limite localStorage.
  }
  return values
}

function removeLegacyStorage(values: Record<string, string>): void {
  try {
    for (const key of Object.keys(values)) localStorage.removeItem(key)
  } catch {
    // A cópia encriptada já foi validada; uma chave residual será assinalada na auditoria.
  }
}

async function readTables(db: LegacyAppDatabase): Promise<AppDatabaseTables> {
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
    db.metadata.toArray(),
    db.journeys.toArray(),
    db.breaks.toArray(),
    db.activities.toArray(),
    db.focusSessions.toArray(),
    db.coffeeRecords.toArray(),
    db.stockEntities.toArray(),
    db.stockMovements.toArray(),
    db.medicationSchedules.toArray(),
    db.medicationDoseEvents.toArray(),
  ])

  return {
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
  }
}

export async function migrateLegacyDataIfNeeded(target: AppDatabase): Promise<LegacyMigrationResult> {
  const targetCounts = await target.counts()
  const targetAlreadyUsed = Object.values(targetCounts).some((count) => count > 0)
  if (targetAlreadyUsed) return { migrated: false, tableRecords: 0, storageRecords: 0 }

  const storage = legacyStorageSnapshot()
  const legacyExists = await Dexie.exists(LEGACY_DB_NAME)
  if (!legacyExists && Object.keys(storage).length === 0) {
    return { migrated: false, tableRecords: 0, storageRecords: 0 }
  }

  let legacy: LegacyAppDatabase | null = null
  let tables: AppDatabaseTables = {
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
  }

  try {
    if (legacyExists) {
      legacy = new LegacyAppDatabase()
      tables = await readTables(legacy)
    }

    const tableRecords = Object.values(tables).reduce((sum, records) => sum + records.length, 0)
    const storageRecords = Object.keys(storage).length
    if (tableRecords === 0 && storageRecords === 0) {
      legacy?.close()
      return { migrated: false, tableRecords: 0, storageRecords: 0 }
    }

    await target.importLegacy(tables, storage)

    const verified = await target.counts()
    for (const name of Object.keys(tables) as Array<keyof AppDatabaseTables>) {
      if (verified[name] !== tables[name].length) {
        throw new Error(`A migração não foi validada para a tabela ${name}.`)
      }
    }

    if (legacy) {
      legacy.close()
      await Dexie.delete(LEGACY_DB_NAME)
    }
    removeLegacyStorage(storage)

    return { migrated: true, tableRecords, storageRecords }
  } catch (error) {
    legacy?.close()
    throw error
  }
}
