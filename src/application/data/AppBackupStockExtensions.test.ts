import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { MedicationDoseStatusService } from '../personalStock/MedicationDoseStatusService'
import { PersonalStockService, STICKS_ENTITY_ID } from '../personalStock/PersonalStockService'
import { StockReconciliationService } from '../personalStock/StockReconciliationService'
import { AppBackupService } from './AppBackupService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(prefix: string): AppDatabase {
  return new AppDatabase(`${prefix}-${operationId()}`)
}

describe('AppBackupService - extensões de stock', () => {
  it('preserva contagens físicas, correções e nova hora de tomas adiadas', async () => {
    const source = makeDatabase('foco-jornada-backup-stock-source')
    const target = makeDatabase('foco-jornada-backup-stock-target')
    try {
      const stock = new PersonalStockService(source)
      const reconciliation = new StockReconciliationService(source)
      const statuses = new MedicationDoseStatusService(source)

      await stock.initializeSticks(10, operationId())
      await reconciliation.reconcileSticksPhysicalCount('8', operationId())

      const medicationId = operationId()
      await stock.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Teste',
        dosage: '100 mg',
        unit: 'comprimidos',
        initialStock: '5',
        startDate: '2026-08-25',
      })
      const schedule = await stock.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '1',
        effectiveFrom: '2026-08-25',
      })
      await reconciliation.reconcileMedicationPhysicalCount(medicationId, '4.5', operationId())
      await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'postponed',
        postponedToLocalTime: '10:00',
      })

      const exported = await new AppBackupService(source).exportText()
      await new AppBackupService(target).restoreFromText(exported)

      const restoredSticks = await target.stockEntities.get(STICKS_ENTITY_ID)
      expect(restoredSticks?.lastPhysicalCountMinor).toBe('8')
      expect(restoredSticks?.lastPhysicalExpectedMinor).toBe('10')
      expect(restoredSticks?.lastPhysicalAdjustmentMinor).toBe('-2')

      const restoredMedication = await target.stockEntities.get(medicationId)
      expect(restoredMedication?.lastPhysicalCountMinor).toBe('4500000')
      expect(restoredMedication?.lastPhysicalExpectedMinor).toBe('5000000')
      expect(restoredMedication?.lastPhysicalAdjustmentMinor).toBe('-500000')

      const corrections = await target.stockMovements.where('type').equals('correction').toArray()
      expect(corrections.filter((movement) => movement.correctionReason === 'physical_count')).toHaveLength(2)

      const restoredEvents = await target.medicationDoseEvents.where('medicationId').equals(medicationId).toArray()
      expect(restoredEvents).toHaveLength(1)
      expect(restoredEvents[0].status).toBe('postponed')
      expect(restoredEvents[0].postponedTo).toBe('2026-08-25T09:00:00.000Z')
    } finally {
      await source.delete()
      await target.delete()
    }
  })
})
