import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { MedicationDoseStatusService } from '../personalStock/MedicationDoseStatusService'
import { PersonalStockService } from '../personalStock/PersonalStockService'
import { AppBackupService, BACKUP_APP_VERSION, BACKUP_FORMAT } from './AppBackupService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-backup-test-${operationId()}`)
}

async function clearAll(db: AppDatabase) {
  await db.transaction(
    'rw',
    db.metadata,
    db.journeys,
    db.breaks,
    db.activities,
    db.focusSessions,
    db.coffeeRecords,
    db.stockEntities,
    db.stockMovements,
    db.medicationSchedules,
    db.medicationDoseEvents,
    async () => {
      await db.medicationDoseEvents.clear()
      await db.medicationSchedules.clear()
      await db.stockMovements.clear()
      await db.stockEntities.clear()
      await db.coffeeRecords.clear()
      await db.focusSessions.clear()
      await db.activities.clear()
      await db.breaks.clear()
      await db.journeys.clear()
      await db.metadata.clear()
    },
  )
}

describe('AppBackupService', () => {
  it('exporta e restaura integralmente as quatro tabelas do stock pessoal', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const statuses = new MedicationDoseStatusService(db)
      const backup = new AppBackupService(db)

      await db.metadata.put({ key: 'app-settings', value: '{"theme":"dark"}', updatedAt: new Date().toISOString() })
      await stock.initializeSticks(20, operationId())
      await stock.consumeStick(operationId())

      const medicationId = operationId()
      await stock.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Teste',
        dosage: '100 mg',
        unit: 'comprimidos',
        initialStock: '10',
        startDate: '2026-08-25',
      })
      const schedule = await stock.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '1',
        effectiveFrom: '2026-08-25',
      })
      await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'not_taken',
      })

      const text = await backup.exportText()
      const payload = JSON.parse(text) as {
        format: string
        appVersion: string
        tables: Record<string, unknown[]>
      }

      expect(payload.format).toBe(BACKUP_FORMAT)
      expect(payload.appVersion).toBe(BACKUP_APP_VERSION)
      expect(payload.tables.stockEntities).toHaveLength(2)
      expect(payload.tables.stockMovements).toHaveLength(3)
      expect(payload.tables.medicationSchedules).toHaveLength(1)
      expect(payload.tables.medicationDoseEvents).toHaveLength(1)

      await clearAll(db)
      expect(await db.stockEntities.count()).toBe(0)

      const restored = await backup.restoreFromText(text)
      expect(restored.tableCounts.stockEntities).toBe(2)
      expect(restored.tableCounts.stockMovements).toBe(3)
      expect(restored.tableCounts.medicationSchedules).toBe(1)
      expect(restored.tableCounts.medicationDoseEvents).toBe(1)
      expect(await db.metadata.count()).toBe(1)
      expect((await stock.getSticksSummary()).stock).toBe(19)
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('10')
      expect((await stock.diagnostic()).integrity).toBe('OK')
    } finally {
      await db.delete()
    }
  })

  it('rejeita um ficheiro inválido antes de apagar os dados atuais', async () => {
    const db = makeDatabase()
    try {
      const backup = new AppBackupService(db)
      await db.metadata.put({ key: 'sentinel', value: 'preservar', updatedAt: new Date().toISOString() })

      await expect(backup.restoreFromText('{"format":"outro-formato"}')).rejects.toThrow('não é uma cópia')
      expect((await db.metadata.get('sentinel'))?.value).toBe('preservar')
    } finally {
      await db.delete()
    }
  })
})
