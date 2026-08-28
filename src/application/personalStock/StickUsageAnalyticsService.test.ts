import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { PersonalStockService, STICKS_ENTITY_ID } from './PersonalStockService'
import { getStickPacingStatus, StickUsageAnalyticsService } from './StickUsageAnalyticsService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-stick-analytics-test-${operationId()}`)
}

describe('StickUsageAnalyticsService', () => {
  it('calculates today intervals from the exact effective timestamps stored in the ledger', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const analytics = new StickUsageAnalyticsService(db)
      await stock.initializeSticks(20, operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())

      const consumptions = (await db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray())
        .filter((movement) => movement.type === 'consumption')
        .sort((left, right) => left.sequence - right.sequence)

      await db.stockMovements.update(consumptions[0].id, { effectiveAt: '2026-08-27T08:00:00.000Z' })
      await db.stockMovements.update(consumptions[1].id, { effectiveAt: '2026-08-27T10:00:00.000Z' })
      await db.stockMovements.update(consumptions[2].id, { effectiveAt: '2026-08-27T13:00:00.000Z' })

      const result = await analytics.getAnalytics(new Date('2026-08-27T15:00:00.000Z'))

      expect(result.todayCount).toBe(3)
      expect(result.firstUseAtToday).toBe('2026-08-27T08:00:00.000Z')
      expect(result.lastUseAt).toBe('2026-08-27T13:00:00.000Z')
      expect(result.averageIntervalMinutesToday).toBe(150)
      expect(result.shortestIntervalMinutesToday).toBe(120)
      expect(result.longestIntervalMinutesToday).toBe(180)
      expect(result.activeSpanMinutesToday).toBe(300)
      expect(result.minutesSinceLastUse).toBe(120)
    } finally {
      await db.delete()
    }
  })

  it('removes a corrected use from active analytics without deleting the original movement', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const analytics = new StickUsageAnalyticsService(db)
      await stock.initializeSticks(5, operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())

      expect((await analytics.getAnalytics()).todayCount).toBe(2)

      await stock.undoLastStick(operationId())

      const result = await analytics.getAnalytics()
      const movements = await db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray()
      expect(result.todayCount).toBe(1)
      expect(movements.filter((movement) => movement.type === 'consumption')).toHaveLength(2)
      expect(movements.filter((movement) => movement.type === 'correction')).toHaveLength(1)
      expect((await stock.getSticksSummary()).stock).toBe(4)
    } finally {
      await db.delete()
    }
  })

  it('compares the last seven calendar days with the preceding seven days', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const analytics = new StickUsageAnalyticsService(db)
      await stock.initializeSticks(10, operationId())
      for (let index = 0; index < 5; index += 1) await stock.consumeStick(operationId())

      const consumptions = (await db.stockMovements.where('entityId').equals(STICKS_ENTITY_ID).toArray())
        .filter((movement) => movement.type === 'consumption')
        .sort((left, right) => left.sequence - right.sequence)

      await db.stockMovements.update(consumptions[0].id, { effectiveAt: '2026-08-20T12:00:00.000Z' })
      await db.stockMovements.update(consumptions[1].id, { effectiveAt: '2026-08-20T13:00:00.000Z' })
      await db.stockMovements.update(consumptions[2].id, { effectiveAt: '2026-08-25T12:00:00.000Z' })
      await db.stockMovements.update(consumptions[3].id, { effectiveAt: '2026-08-26T12:00:00.000Z' })
      await db.stockMovements.update(consumptions[4].id, { effectiveAt: '2026-08-27T12:00:00.000Z' })

      const result = await analytics.getAnalytics(new Date('2026-08-27T18:00:00.000Z'))

      expect(result.previous7Total).toBe(2)
      expect(result.last7Total).toBe(3)
      expect(result.trendDifference).toBe(1)
      expect(result.trendDirection).toBe('up')
      expect(result.last7Days.at(-1)).toEqual({ date: '2026-08-27', count: 1 })
    } finally {
      await db.delete()
    }
  })
})

describe('getStickPacingStatus', () => {
  it('inicia uma meta comportamental de 30 minutos após o último stick', () => {
    const status = getStickPacingStatus(
      '2026-08-29T00:00:00.000Z',
      new Date('2026-08-29T00:10:00.000Z'),
      30,
    )

    expect(status.ready).toBe(false)
    expect(status.elapsedSeconds).toBe(600)
    expect(status.remainingSeconds).toBe(1200)
    expect(status.progressPercent).toBe(33)
    expect(status.nextTargetAt).toBe('2026-08-29T00:30:00.000Z')
  })

  it('fica concluído quando o intervalo definido termina', () => {
    const status = getStickPacingStatus(
      '2026-08-29T00:00:00.000Z',
      new Date('2026-08-29T00:30:00.000Z'),
      30,
    )

    expect(status.ready).toBe(true)
    expect(status.remainingSeconds).toBe(0)
    expect(status.progressPercent).toBe(100)
  })

  it('fica pronto quando ainda não existe utilização registada', () => {
    const status = getStickPacingStatus(null, new Date('2026-08-29T00:00:00.000Z'), 30)

    expect(status.ready).toBe(true)
    expect(status.elapsedSeconds).toBeNull()
    expect(status.nextTargetAt).toBeNull()
  })
})

