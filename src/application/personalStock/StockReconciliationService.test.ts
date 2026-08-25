import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { PersonalStockService, STICKS_ENTITY_ID } from './PersonalStockService'
import { StockReconciliationService } from './StockReconciliationService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-reconciliation-test-${operationId()}`)
}

describe('StockReconciliationService', () => {
  it('reconcilia a contagem física de sticks através de um movimento auditável', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const reconciliation = new StockReconciliationService(db)
      await stock.initializeSticks(20, operationId())
      await stock.consumeStick(operationId())

      const check = await reconciliation.reconcileSticksPhysicalCount('17', operationId())
      expect(check.expected).toBe('19')
      expect(check.counted).toBe('17')
      expect(check.adjustment).toBe('-2')
      expect((await stock.getSticksSummary()).stock).toBe(17)

      const movements = await db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).sortBy('sequence')
      expect(movements.at(-1)?.type).toBe('correction')
      expect(movements.at(-1)?.correctionReason).toBe('physical_count')
      expect(movements.at(-1)?.quantityMinor).toBe('-2')

      const saved = await reconciliation.getPhysicalCheck(STICKS_ENTITY_ID)
      expect(saved?.counted).toBe('17')
      expect(saved?.expected).toBe('19')
    } finally {
      await db.delete()
    }
  })

  it('guarda uma conferência sem criar movimento quando não existe diferença', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const reconciliation = new StockReconciliationService(db)
      await stock.initializeSticks(5, operationId())
      const before = (await stock.getSticksSummary()).movementCount

      const check = await reconciliation.reconcileSticksPhysicalCount('5', operationId())
      expect(check.adjustment).toBe('0')
      expect((await stock.getSticksSummary()).movementCount).toBe(before)
      expect((await reconciliation.getPhysicalCheck(STICKS_ENTITY_ID))?.counted).toBe('5')
    } finally {
      await db.delete()
    }
  })

  it('reconcilia quantidades decimais de medicamento sem usar floating point', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const reconciliation = new StockReconciliationService(db)
      const medicationId = operationId()
      await stock.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Teste',
        dosage: '100 mg',
        unit: 'comprimidos',
        initialStock: '5.25',
        startDate: '2026-08-25',
      })

      const check = await reconciliation.reconcileMedicationPhysicalCount(medicationId, '4,75', operationId())
      expect(check.expected).toBe('5.25')
      expect(check.counted).toBe('4.75')
      expect(check.adjustment).toBe('-0.5')
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('4.75')
    } finally {
      await db.delete()
    }
  })

  it('corrige a última reposição sem apagar o movimento original', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const reconciliation = new StockReconciliationService(db)
      await stock.initializeSticks(10, operationId())
      await stock.restockSticks(5, operationId())

      await reconciliation.undoLastStickRestock(operationId())
      const summary = await stock.getSticksSummary()
      expect(summary.stock).toBe(10)
      expect(summary.movementCount).toBe(3)

      const movements = await db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).sortBy('sequence')
      const restock = movements.find((movement) => movement.type === 'restock')
      const correction = movements.at(-1)
      expect(correction?.type).toBe('correction')
      expect(correction?.correctionReason).toBe('undo_restock')
      expect(correction?.correctionOf).toBe(restock?.id)
      expect(correction?.quantityMinor).toBe('-5')
    } finally {
      await db.delete()
    }
  })

  it('não anula uma reposição se isso tornar o stock negativo', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const reconciliation = new StockReconciliationService(db)
      await stock.initializeSticks(1, operationId())
      await stock.restockSticks(5, operationId())
      for (let index = 0; index < 4; index += 1) await stock.consumeStick(operationId())

      await expect(reconciliation.undoLastStickRestock(operationId())).rejects.toThrow('parte do stock já foi consumida')
      expect((await stock.getSticksSummary()).stock).toBe(2)
    } finally {
      await db.delete()
    }
  })
})
