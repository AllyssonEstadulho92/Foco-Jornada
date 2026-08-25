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

  return parsed as unknown as AppBackupPayload
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
    const payload = parseBackup(text)

    await this.db.transaction(
      'rw',
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
