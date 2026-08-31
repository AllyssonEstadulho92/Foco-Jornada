import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { AppDataIntegrityService } from './AppDataIntegrityService'

function makeDatabase(): AppDatabase {
  return new AppDatabase(`integrity-${globalThis.crypto.randomUUID()}`)
}

describe('AppDataIntegrityService', () => {
  it('considera íntegra uma base vazia', async () => {
    const db = makeDatabase()
    try {
      const report = await new AppDataIntegrityService(db).audit()
      expect(report.ok).toBe(true)
      expect(report.issues).toEqual([])
    } finally {
      await db.delete()
    }
  })

  it('deteta referências órfãs sem alterar os dados', async () => {
    const db = makeDatabase()
    try {
      await db.breaks.add({
        id: 'break-orphan',
        journeyId: 'missing-journey',
        type: 'short',
        startedAt: '2026-08-31T12:00:00.000Z',
        status: 'active',
      })

      const report = await new AppDataIntegrityService(db).audit()
      expect(report.ok).toBe(false)
      expect(report.issues.some((item) => item.code === 'break.orphan')).toBe(true)
      expect(await db.breaks.count()).toBe(1)
    } finally {
      await db.delete()
    }
  })

  it('deteta ledger de stock incoerente', async () => {
    const db = makeDatabase()
    try {
      await db.stockEntities.add({
        id: 'med-1',
        kind: 'medication',
        name: 'Teste',
        dosage: '1 mg',
        unit: 'unidade',
        timezone: 'Europe/Lisbon',
        startDate: '2026-08-31',
        createdAt: '2026-08-31T00:00:00.000Z',
      })
      await db.stockMovements.add({
        id: 'movement-1',
        operationId: 'operation-1',
        entityId: 'med-1',
        type: 'initial_stock',
        quantityMinor: '1000000',
        balanceBeforeMinor: '0',
        balanceAfterMinor: '2000000',
        sequence: 0,
        effectiveAt: '2026-08-31T00:00:00.000Z',
        createdAt: '2026-08-31T00:00:00.000Z',
      })

      const report = await new AppDataIntegrityService(db).audit()
      expect(report.ok).toBe(false)
      expect(report.issues.some((item) => item.code === 'stock.ledger')).toBe(true)
    } finally {
      await db.delete()
    }
  })
})
