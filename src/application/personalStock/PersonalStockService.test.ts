import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { PersonalStockService, STICKS_ENTITY_ID } from './PersonalStockService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-stock-test-${operationId()}`)
}

describe('PersonalStockService - sticks', () => {
  it('never allows the twenty-first use after a stock of twenty', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      await service.initializeSticks(20, operationId())
      for (let index = 0; index < 20; index += 1) await service.consumeStick(operationId())

      expect((await service.getSticksSummary()).stock).toBe(0)
      await expect(service.consumeStick(operationId())).rejects.toThrow('Stock insuficiente')
      expect((await service.getSticksSummary()).stock).toBe(0)
    } finally {
      await db.delete()
    }
  })

  it('treats the same operation id as idempotent', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      await service.initializeSticks(2, operationId())
      const id = operationId()
      const first = await service.consumeStick(id)
      const second = await service.consumeStick(id)

      expect(first.duplicated).toBe(false)
      expect(second.duplicated).toBe(true)
      expect(second.summary.stock).toBe(1)
      expect(second.summary.movementCount).toBe(2)
    } finally {
      await db.delete()
    }
  })

  it('serializes two simultaneous consumers when only one stick exists', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      await service.initializeSticks(1, operationId())
      const results = await Promise.allSettled([
        service.consumeStick(operationId()),
        service.consumeStick(operationId()),
      ])

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
      const summary = await service.getSticksSummary()
      expect(summary.stock).toBe(0)
      expect(summary.movementCount).toBe(2)
      expect(summary.ok).toBe(true)
    } finally {
      await db.delete()
    }
  })

  it('cannot undo the same single consumption twice under concurrency', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      await service.initializeSticks(1, operationId())
      await service.consumeStick(operationId())

      const results = await Promise.allSettled([
        service.undoLastStick(operationId()),
        service.undoLastStick(operationId()),
      ])

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
      const summary = await service.getSticksSummary()
      expect(summary.stock).toBe(1)
      expect(summary.movementCount).toBe(3)
      expect(summary.ok).toBe(true)
    } finally {
      await db.delete()
    }
  })

  it('keeps exactly the same reconstructed stock after reopening the database', async () => {
    const name = `foco-jornada-stock-restart-${operationId()}`
    const firstDb = new AppDatabase(name)
    const first = new PersonalStockService(firstDb)
    await first.initializeSticks(20, operationId())
    await first.consumeStick(operationId())
    await first.restockSticks(5, operationId())
    expect((await first.getSticksSummary()).stock).toBe(24)
    firstDb.close()

    const reopenedDb = new AppDatabase(name)
    try {
      const reopened = new PersonalStockService(reopenedDb)
      const summary = await reopened.getSticksSummary()
      expect(summary.stock).toBe(24)
      expect(summary.storedMinor).toBe('24')
      expect(summary.reconstructedMinor).toBe('24')
      expect(summary.ok).toBe(true)
    } finally {
      await reopenedDb.delete()
    }
  })

  it('rejects a sticks balance above Number.MAX_SAFE_INTEGER', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      await service.initializeSticks(Number.MAX_SAFE_INTEGER, operationId())
      await expect(service.restockSticks(1, operationId())).rejects.toThrow('limite seguro')
      expect((await service.getSticksSummary()).stock).toBe(Number.MAX_SAFE_INTEGER)
    } finally {
      await db.delete()
    }
  })

  it('detects a corrupted movement chain instead of masking it', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      await service.initializeSticks(5, operationId())
      await service.consumeStick(operationId())
      const movements = await db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).sortBy('sequence')
      await db.stockMovements.update(movements[1].id, { balanceAfterMinor: '5' })
      await expect(service.reconcile(STICKS_ENTITY_ID)).rejects.toThrow('INCONSISTÊNCIA')
    } finally {
      await db.delete()
    }
  })
})

describe('PersonalStockService - medications', () => {
  it('simulates scheduled doses chronologically instead of stock divided by daily average', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      const medicationId = operationId()
      await service.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Carbamazepina',
        dosage: '400 mg',
        unit: 'comprimidos',
        initialStock: '38',
        startDate: '2026-08-25',
      })
      await service.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '2',
        effectiveFrom: '2026-08-25',
      })
      await service.addMedicationSchedule({
        medicationId,
        localTime: '22:00',
        quantity: '3',
        effectiveFrom: '2026-08-25',
      })

      const forecast = await service.forecastMedication(medicationId, new Date('2026-08-25T12:00:00Z'))
      expect(forecast.nextDose.quantity).toBe('3')
      expect(forecast.nextDose.scheduledAt).toBe('2026-08-25T21:00:00.000Z')
      expect(forecast.lastPossibleDose?.scheduledAt).toBe('2026-09-01T21:00:00.000Z')
      expect(forecast.stockAfterLastPossible).toBe('0')
      expect(forecast.firstImpossibleDose.scheduledAt).toBe('2026-09-02T07:00:00.000Z')
      expect(forecast.missingQuantity).toBe('2')
      expect(forecast.exact).toBe(true)
    } finally {
      await db.delete()
    }
  })

  it('deduplicates the same scheduled dose even with different operation ids', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      const medicationId = operationId()
      await service.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Teste',
        dosage: '100 mg',
        unit: 'comprimidos',
        initialStock: '5',
        startDate: '2026-08-25',
      })
      const schedule = await service.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '2',
        effectiveFrom: '2026-08-25',
      })

      const results = await Promise.all([
        service.confirmMedicationDose({ medicationId, scheduleId: schedule.id, onDate: '2026-08-25', operationId: operationId() }),
        service.confirmMedicationDose({ medicationId, scheduleId: schedule.id, onDate: '2026-08-25', operationId: operationId() }),
      ])

      expect(results.filter((result) => result.duplicated)).toHaveLength(1)
      const summary = await service.getMedicationSummary(medicationId)
      expect(summary.stock).toBe('3')
      expect(summary.movementCount).toBe(2)
      expect(await service.listDoseEvents(medicationId)).toHaveLength(1)
    } finally {
      await db.delete()
    }
  })

  it('corrects a confirmed dose with a new auditable movement and restores stock', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      const medicationId = operationId()
      await service.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Teste',
        dosage: '100 mg',
        unit: 'comprimidos',
        initialStock: '1.5',
        startDate: '2026-08-25',
      })
      const schedule = await service.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '0.5',
        effectiveFrom: '2026-08-25',
      })
      const taken = await service.confirmMedicationDose({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
      })
      expect(taken.stock).toBe('1')

      const corrected = await service.undoMedicationDose(taken.event.id, operationId())
      expect(corrected.stock).toBe('1.5')
      expect(corrected.movementCount).toBe(3)
      expect(await service.listDoseEvents(medicationId)).toHaveLength(2)
      expect(corrected.ok).toBe(true)
    } finally {
      await db.delete()
    }
  })

  it('does not decrement stock merely because a scheduled time has passed', async () => {
    const db = makeDatabase()
    try {
      const service = new PersonalStockService(db)
      const medicationId = operationId()
      await service.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Teste',
        dosage: '100 mg',
        unit: 'comprimidos',
        initialStock: '5',
        startDate: '2026-08-25',
      })
      await service.addMedicationSchedule({
        medicationId,
        localTime: '08:00',
        quantity: '2',
        effectiveFrom: '2026-08-25',
      })

      const forecast = await service.forecastMedication(medicationId, new Date('2026-08-25T12:00:00Z'))
      expect((await service.getMedicationSummary(medicationId)).stock).toBe('5')
      expect(forecast.nextDose.scheduledAt).toBe('2026-08-26T07:00:00.000Z')
    } finally {
      await db.delete()
    }
  })
})
