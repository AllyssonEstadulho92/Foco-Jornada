import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { NicotineAwarenessService } from './NicotineAwarenessService'
import { PersonalStockService } from './PersonalStockService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-nicotine-test-${operationId()}`)
}

function planSettings() {
  return {
    reductionPlanEnabled: true,
    dailyBaselineSticks: 13,
    weeklyReductionStep: 1,
    reductionPlanStartDate: '2026-08-26',
  }
}

describe('NicotineAwarenessService', () => {
  it('uses net confirmed stick consumption and exact integer arithmetic', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const nicotine = new NicotineAwarenessService(db)
      await stock.initializeSticks(10, operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())
      await stock.undoLastStick(operationId())

      const summary = await nicotine.getSummary(new Date())
      expect(summary.allTime.sticks).toBe(2)
      expect(summary.allTime.minMg).toBe('0.92')
      expect(summary.allTime.maxMg).toBe('1.36')
    } finally {
      await db.delete()
    }
  })

  it('persists custom range, reduction plan and notes in metadata included by backup', async () => {
    const db = makeDatabase()
    try {
      const nicotine = new NicotineAwarenessService(db)
      const saved = await nicotine.saveSettings({
        profileId: 'custom',
        customMinMg: '0.500',
        customMaxMg: '0.750',
        notes: 'Produto confirmado pela embalagem.',
        ...planSettings(),
      })
      const restored = await nicotine.getSettings()

      expect(restored.profileId).toBe('custom')
      expect(restored.customMinMg).toBe('0.500')
      expect(restored.customMaxMg).toBe('0.750')
      expect(restored.notes).toBe('Produto confirmado pela embalagem.')
      expect(restored.dailyBaselineSticks).toBe(13)
      expect(restored.weeklyReductionStep).toBe(1)
      expect(restored.reductionPlanStartDate).toBe('2026-08-26')
      expect(restored.reductionPlanEnabled).toBe(true)
      expect(saved.updatedAt).toBeTruthy()
      expect(await db.metadata.get('personal-stock:nicotine-awareness-v1')).toBeTruthy()
    } finally {
      await db.delete()
    }
  })

  it('builds a deterministic personal reduction trajectory from the 13-stick baseline', async () => {
    const db = makeDatabase()
    try {
      const nicotine = new NicotineAwarenessService(db)
      await nicotine.saveSettings({
        profileId: 'neo-published-range',
        customMinMg: '0.460',
        customMaxMg: '0.680',
        notes: '',
        ...planSettings(),
      })

      const firstWeek = await nicotine.getSummary(new Date('2026-08-26T12:00:00Z'))
      expect(firstWeek.reductionPlan.baselineDailySticks).toBe(13)
      expect(firstWeek.reductionPlan.weekNumber).toBe(1)
      expect(firstWeek.reductionPlan.targetToday).toBe(12)
      expect(firstWeek.reductionPlan.nextWeekTarget).toBe(11)
      expect(firstWeek.reductionPlan.zeroTargetDate).toBe('2026-11-18')

      const thirdWeek = await nicotine.getSummary(new Date('2026-09-09T12:00:00Z'))
      expect(thirdWeek.reductionPlan.weekNumber).toBe(3)
      expect(thirdWeek.reductionPlan.targetToday).toBe(10)
    } finally {
      await db.delete()
    }
  })

  it('rejects an inverted custom interval', async () => {
    const db = makeDatabase()
    try {
      const nicotine = new NicotineAwarenessService(db)
      await expect(nicotine.saveSettings({
        profileId: 'custom',
        customMinMg: '1.000',
        customMaxMg: '0.500',
        notes: '',
        ...planSettings(),
      })).rejects.toThrow('máximo')
    } finally {
      await db.delete()
    }
  })

  it('rejects invalid reduction-plan values instead of silently normalizing saved input', async () => {
    const db = makeDatabase()
    try {
      const nicotine = new NicotineAwarenessService(db)
      await expect(nicotine.saveSettings({
        profileId: 'neo-published-range',
        customMinMg: '0.460',
        customMaxMg: '0.680',
        notes: '',
        reductionPlanEnabled: true,
        dailyBaselineSticks: 0,
        weeklyReductionStep: 1,
        reductionPlanStartDate: '2026-08-26',
      })).rejects.toThrow('linha de base')
    } finally {
      await db.delete()
    }
  })
})
