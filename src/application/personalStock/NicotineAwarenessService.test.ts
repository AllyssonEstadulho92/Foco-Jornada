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

  it('persists custom range and notes in metadata included by backup', async () => {
    const db = makeDatabase()
    try {
      const nicotine = new NicotineAwarenessService(db)
      const saved = await nicotine.saveSettings({
        profileId: 'custom',
        customMinMg: '0.500',
        customMaxMg: '0.750',
        notes: 'Produto confirmado pela embalagem.',
      })
      const restored = await nicotine.getSettings()

      expect(restored.profileId).toBe('custom')
      expect(restored.customMinMg).toBe('0.500')
      expect(restored.customMaxMg).toBe('0.750')
      expect(restored.notes).toBe('Produto confirmado pela embalagem.')
      expect(saved.updatedAt).toBeTruthy()
      expect(await db.metadata.get('personal-stock:nicotine-awareness-v1')).toBeTruthy()
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
      })).rejects.toThrow('máximo')
    } finally {
      await db.delete()
    }
  })
})
