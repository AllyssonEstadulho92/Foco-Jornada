import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { PersonalStockService } from './PersonalStockService'
import { StickPackPlannerService } from './StickPackPlannerService'
import { StockReconciliationService } from './StockReconciliationService'

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
      expect(projection.packTrackingExact).toBe(true)
      expect(projection.packTrackingIssue).toBeNull()
      expect(projection.historicalReliable).toBe(false)
      expect(projection.historicalDepletionDate).toBeNull()
      expect(projection.currentPackHistoricalDepletionDate).toBeNull()
      expect(projection.packForecasts).toHaveLength(12)
      expect(projection.packForecasts[0]).toMatchObject({
        sequence: 1,
        packNumber: 1,
        kind: 'sealed',
        sticks: 20,
        cumulativeSticks: 20,
        actualStartAt: null,
        estimatedStartDate: null,
        estimatedDurationDays: null,
        estimatedDepletionDate: null,
      })
      expect(projection.packForecasts[11]).toMatchObject({
        sequence: 12,
        packNumber: 12,
        kind: 'sealed',
        sticks: 20,
        cumulativeSticks: 240,
        actualStartAt: null,
        estimatedStartDate: null,
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
      expect(projection.historicalDepletionDate).toBe('2026-09-23')
      expect(projection.currentPackHistoricalDays).toBe('7.0')
      expect(projection.currentPackHistoricalDepletionDate).toBe('2026-09-03')
      expect(projection.packUsagePeriods).toEqual([
        {
          packNumber: 1,
          consumedSticks: 13,
          actualStartAt: null,
          actualEndAt: null,
          status: 'current',
        },
      ])
      expect(projection.packForecasts).toEqual([
        {
          sequence: 1,
          packNumber: 1,
          kind: 'current',
          sticks: 7,
          cumulativeSticks: 7,
          actualStartAt: null,
          estimatedStartDate: null,
          estimatedDurationDays: '7.0',
          estimatedDepletionDate: '2026-09-03',
        },
        {
          sequence: 2,
          packNumber: 2,
          kind: 'sealed',
          sticks: 20,
          cumulativeSticks: 27,
          actualStartAt: null,
          estimatedStartDate: '2026-09-04',
          estimatedDurationDays: '20.0',
          estimatedDepletionDate: '2026-09-23',
        },
      ])
    } finally {
      await db.delete()
    }
  })


  it('does not reuse today\'s observed daily rate when forecasting the remaining packs', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      await planner.saveSettings({ packCount: 2, sticksPerPack: 20 })
      await stock.initializeSticks(40, operationId())

      for (let index = 0; index < 15; index += 1) await stock.consumeStick(operationId())

      const consumptions = (await db.stockMovements.where('entityId').equals('stock:sticks:glo').toArray())
        .filter((movement) => movement.type === 'consumption')
        .sort((left, right) => left.sequence - right.sequence)

      for (let index = 0; index < 5; index += 1) {
        await db.stockMovements.update(consumptions[index].id, { effectiveAt: `2026-08-26T${String(8 + index).padStart(2, '0')}:00:00.000Z` })
      }
      for (let index = 5; index < 10; index += 1) {
        await db.stockMovements.update(consumptions[index].id, { effectiveAt: `2026-08-27T${String(8 + index - 5).padStart(2, '0')}:00:00.000Z` })
      }
      for (let index = 10; index < 15; index += 1) {
        await db.stockMovements.update(consumptions[index].id, { effectiveAt: `2026-08-28T${String(8 + index - 10).padStart(2, '0')}:00:00.000Z` })
      }

      const projection = await planner.getProjection(new Date('2026-08-28T14:00:00.000Z'))

      expect(projection.historicalDailyAverage).toBe('5.0')
      expect(projection.usedToday).toBe(5)
      expect(projection.currentStockSticks).toBe(25)
      expect(projection.currentPackRemaining).toBe(5)
      expect(projection.currentPackHistoricalDays).toBe('1.0')
      expect(projection.currentPackHistoricalDepletionDate).toBe('2026-08-29')
      expect(projection.packForecasts[0].estimatedDepletionDate).toBe('2026-08-29')
      expect(projection.packForecasts[1].estimatedStartDate).toBe('2026-08-30')
      expect(projection.packForecasts[1].estimatedDepletionDate).toBe('2026-09-02')
      expect(projection.historicalDepletionDate).toBe('2026-09-02')
    } finally {
      await db.delete()
    }
  })


  it('records exact start and end timestamps when a full tracked pack is completed', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      await planner.saveSettings({ packCount: 2, sticksPerPack: 20 })
      await stock.initializeSticks(40, operationId())

      for (let index = 0; index < 21; index += 1) {
        await stock.consumeStick(operationId())
      }

      const consumptions = (await db.stockMovements.where('entityId').equals('stock:sticks:glo').toArray())
        .filter((movement) => movement.type === 'consumption')
        .sort((left, right) => left.sequence - right.sequence)

      for (let index = 0; index < 20; index += 1) {
        await db.stockMovements.update(consumptions[index].id, {
          effectiveAt: `2026-08-${String(index < 10 ? 25 : 26).padStart(2, '0')}T${String(8 + (index % 10)).padStart(2, '0')}:00:00.000Z`,
        })
      }
      await db.stockMovements.update(consumptions[20].id, { effectiveAt: '2026-08-27T09:00:00.000Z' })

      const projection = await planner.getProjection(new Date('2026-08-27T12:00:00.000Z'))

      expect(projection.packUsagePeriods[0]).toEqual({
        packNumber: 1,
        consumedSticks: 20,
        actualStartAt: '2026-08-25T08:00:00.000Z',
        actualEndAt: '2026-08-26T17:00:00.000Z',
        status: 'completed',
      })
      expect(projection.packUsagePeriods[1]).toEqual({
        packNumber: 2,
        consumedSticks: 1,
        actualStartAt: '2026-08-27T09:00:00.000Z',
        actualEndAt: null,
        status: 'current',
      })
      expect(projection.packForecasts[0].packNumber).toBe(2)
      expect(projection.packForecasts[0].actualStartAt).toBe('2026-08-27T09:00:00.000Z')
    } finally {
      await db.delete()
    }
  })

  it('keeps real pack start and end dates even before forecast history becomes reliable', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      await planner.saveSettings({ packCount: 1, sticksPerPack: 20 })
      await stock.initializeSticks(20, operationId())

      for (let index = 0; index < 20; index += 1) {
        await stock.consumeStick(operationId())
      }

      const consumptions = (await db.stockMovements.where('entityId').equals('stock:sticks:glo').toArray())
        .filter((movement) => movement.type === 'consumption')
        .sort((left, right) => left.sequence - right.sequence)

      for (let index = 0; index < 20; index += 1) {
        await db.stockMovements.update(consumptions[index].id, {
          effectiveAt: `2026-08-27T${String(1 + index).padStart(2, '0')}:00:00.000Z`,
        })
      }

      const projection = await planner.getProjection(new Date('2026-08-27T22:00:00.000Z'))

      expect(projection.historicalCoverageDays).toBe(1)
      expect(projection.historicalReliable).toBe(false)
      expect(projection.packUsagePeriods).toEqual([
        {
          packNumber: 1,
          consumedSticks: 20,
          actualStartAt: '2026-08-27T01:00:00.000Z',
          actualEndAt: '2026-08-27T20:00:00.000Z',
          status: 'completed',
        },
      ])
      expect(projection.packForecasts).toEqual([])
    } finally {
      await db.delete()
    }
  })


  it('stops calling pack dates exact after a physical-count correction changes pack boundaries', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      const reconciliation = new StockReconciliationService(db)

      await planner.saveSettings({ packCount: 2, sticksPerPack: 20 })
      await stock.initializeSticks(40, operationId())
      await stock.consumeStick(operationId())
      await reconciliation.reconcileSticksPhysicalCount('38', operationId())

      const projection = await planner.getProjection(new Date())

      expect(projection.currentStockSticks).toBe(38)
      expect(projection.packTrackingExact).toBe(false)
      expect(projection.packTrackingIssue).toContain('contagem física')
      expect(projection.ledgerOk).toBe(true)
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
