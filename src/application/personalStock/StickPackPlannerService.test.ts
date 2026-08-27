import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { PersonalStockService } from './PersonalStockService'
import { StickPackPlannerService } from './StickPackPlannerService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-stick-pack-test-${operationId()}`)
}

describe('StickPackPlannerService', () => {
  it('represents 12 packs of 20 as exactly 240 sticks without inventing a depletion date', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      await planner.saveSettings({ packCount: 12, sticksPerPack: 20 })
      await stock.initializeSticks(240, operationId())

      const projection = await planner.getProjection(new Date('2026-08-27T12:00:00Z'))

      expect(projection.configuredTotalSticks).toBe(240)
      expect(projection.currentStockSticks).toBe(240)
      expect(projection.configuredMatchesCurrent).toBe(true)
      expect(projection.fullPacksRemaining).toBe(12)
      expect(projection.looseSticksRemaining).toBe(0)
      expect(projection.sealedPacksRemaining).toBe(12)
      expect(projection.currentPackStarted).toBe(false)
      expect(projection.currentPackRemaining).toBe(0)
      expect(projection.currentPackPercentRemaining).toBe(100)
      expect(projection.packEquivalent).toBe('12.0')
      expect(projection.historicalReliable).toBe(false)
      expect(projection.historicalDepletionDate).toBeNull()
      expect(projection.currentPackHistoricalDepletionDate).toBeNull()
      expect(projection.packForecasts).toHaveLength(12)
      expect(projection.packForecasts[0]).toMatchObject({
        sequence: 1,
        kind: 'sealed',
        sticks: 20,
        cumulativeSticks: 20,
        estimatedDurationDays: null,
        estimatedDepletionDate: null,
      })
      expect(projection.packForecasts[11]).toMatchObject({
        sequence: 12,
        kind: 'sealed',
        sticks: 20,
        cumulativeSticks: 240,
        estimatedDurationDays: null,
        estimatedDepletionDate: null,
      })
    } finally {
      await db.delete()
    }
  })

  it('keeps the exact pack equivalent synchronized with ledger consumption', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      await planner.saveSettings({ packCount: 12, sticksPerPack: 20 })
      await stock.initializeSticks(240, operationId())
      await stock.consumeStick(operationId())

      const projection = await planner.getProjection(new Date())

      expect(projection.currentStockSticks).toBe(239)
      expect(projection.fullPacksRemaining).toBe(11)
      expect(projection.looseSticksRemaining).toBe(19)
      expect(projection.sealedPacksRemaining).toBe(11)
      expect(projection.currentPackStarted).toBe(true)
      expect(projection.currentPackRemaining).toBe(19)
      expect(projection.currentPackPercentRemaining).toBe(95)
      expect(projection.configuredDifference).toBe(1)
      expect(projection.configuredMatchesCurrent).toBe(false)
      expect(projection.ledgerOk).toBe(true)
    } finally {
      await db.delete()
    }
  })

  it('only estimates duration after at least three observed calendar days', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      await planner.saveSettings({ packCount: 2, sticksPerPack: 20 })
      await stock.initializeSticks(30, operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())

      const consumptions = (await db.stockMovements.where('entityId').equals('stock:sticks:glo').toArray())
        .filter((movement) => movement.type === 'consumption')
        .sort((left, right) => left.sequence - right.sequence)

      await db.stockMovements.update(consumptions[0].id, { effectiveAt: '2026-08-25T12:00:00.000Z' })
      await db.stockMovements.update(consumptions[1].id, { effectiveAt: '2026-08-26T12:00:00.000Z' })
      await db.stockMovements.update(consumptions[2].id, { effectiveAt: '2026-08-27T12:00:00.000Z' })

      const projection = await planner.getProjection(new Date('2026-08-27T18:00:00Z'))

      expect(projection.currentStockSticks).toBe(27)
      expect(projection.currentPackStarted).toBe(true)
      expect(projection.currentPackRemaining).toBe(7)
      expect(projection.sealedPacksRemaining).toBe(1)
      expect(projection.historicalCoverageDays).toBe(3)
      expect(projection.historicalReliable).toBe(true)
      expect(projection.historicalDailyAverage).toBe('1.0')
      expect(projection.historicalDays).toBe('27.0')
      expect(projection.historicalDepletionDate).toBe('2026-09-22')
      expect(projection.currentPackHistoricalDays).toBe('7.0')
      expect(projection.currentPackHistoricalDepletionDate).toBe('2026-09-02')
      expect(projection.packForecasts).toEqual([
        {
          sequence: 1,
          kind: 'current',
          sticks: 7,
          cumulativeSticks: 7,
          estimatedDurationDays: '7.0',
          estimatedDepletionDate: '2026-09-02',
        },
        {
          sequence: 2,
          kind: 'sealed',
          sticks: 20,
          cumulativeSticks: 27,
          estimatedDurationDays: '20.0',
          estimatedDepletionDate: '2026-09-22',
        },
      ])
    } finally {
      await db.delete()
    }
  })

  it('persists pack configuration in metadata so it is included in the normal backup', async () => {
    const db = makeDatabase()
    try {
      const planner = new StickPackPlannerService(db)
      await planner.saveSettings({ packCount: 12, sticksPerPack: 20 })

      const restored = await planner.getSettings()
      expect(restored.packCount).toBe(12)
      expect(restored.sticksPerPack).toBe(20)
      expect(await db.metadata.get('personal-stock:stick-pack-planner-v1')).toBeTruthy()
    } finally {
      await db.delete()
    }
  })

  it('rejects impossible pack configurations instead of rounding them silently', async () => {
    const db = makeDatabase()
    try {
      const planner = new StickPackPlannerService(db)
      await expect(planner.saveSettings({ packCount: 12.5, sticksPerPack: 20 })).rejects.toThrow('maços')
      await expect(planner.saveSettings({ packCount: 12, sticksPerPack: 0 })).rejects.toThrow('sticks por maço')
    } finally {
      await db.delete()
    }
  })
})
