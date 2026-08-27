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
  it('does not assume a nicotine value until a veo variant is selected', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const nicotine = new NicotineAwarenessService(db)
      await stock.initializeSticks(10, operationId())
      await stock.consumeStick(operationId())

      const summary = await nicotine.getSummary(new Date())
      expect(summary.selected).toBe(false)
      expect(summary.allTime.sticks).toBe(1)
      expect(summary.allTime.contentLabMeanMg).toBeNull()
      expect(summary.allTime.emissionLabMeanMg).toBeNull()
    } finally {
      await db.delete()
    }
  })

  it('uses the published veo Green Click laboratory means with exact integer arithmetic', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const nicotine = new NicotineAwarenessService(db)
      await nicotine.saveSettings({
        profileId: 'veo-green-click-2026',
        customContentMeanMg: '',
        customEmissionMeanMg: '',
        customSourceLabel: '',
        notes: '',
      })
      await stock.initializeSticks(10, operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())
      await stock.consumeStick(operationId())
      await stock.undoLastStick(operationId())

      const summary = await nicotine.getSummary(new Date())
      expect(summary.selected).toBe(true)
      expect(summary.allTime.sticks).toBe(2)
      expect(summary.contentPerStickMeanMg).toBe('3.46')
      expect(summary.contentPerStickSdMg).toBe('0.31')
      expect(summary.emissionPerStickMeanMg).toBe('0.98')
      expect(summary.emissionPerStickSdMg).toBe('0.03')
      expect(summary.allTime.contentLabMeanMg).toBe('6.92')
      expect(summary.allTime.emissionLabMeanMg).toBe('1.96')
      expect(summary.absorptionStatement).toContain('não pode ser calculada com exatidão')
    } finally {
      await db.delete()
    }
  })

  it('uses the published veo Purple Click values independently from Green Click', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const nicotine = new NicotineAwarenessService(db)
      await nicotine.saveSettings({
        profileId: 'veo-purple-click-2026',
        customContentMeanMg: '',
        customEmissionMeanMg: '',
        customSourceLabel: '',
        notes: 'Purple Click.',
      })
      await stock.initializeSticks(5, operationId())
      await stock.consumeStick(operationId())

      const summary = await nicotine.getSummary(new Date())
      expect(summary.contentPerStickMeanMg).toBe('3.22')
      expect(summary.emissionPerStickMeanMg).toBe('0.95')
      expect(summary.allTime.contentLabMeanMg).toBe('3.22')
      expect(summary.allTime.emissionLabMeanMg).toBe('0.95')
      expect(summary.evidenceNote).toContain('Purple Click')
    } finally {
      await db.delete()
    }
  })

  it('persists a documented custom laboratory value in v2 metadata', async () => {
    const db = makeDatabase()
    try {
      const nicotine = new NicotineAwarenessService(db)
      const saved = await nicotine.saveSettings({
        profileId: 'custom-lab',
        customContentMeanMg: '3.500',
        customEmissionMeanMg: '1.000',
        customSourceLabel: 'Relatório laboratorial lote X',
        notes: 'Valor confirmado externamente.',
      })
      const restored = await nicotine.getSettings()

      expect(restored.profileId).toBe('custom-lab')
      expect(restored.customContentMeanMg).toBe('3.500')
      expect(restored.customEmissionMeanMg).toBe('1.000')
      expect(restored.customSourceLabel).toBe('Relatório laboratorial lote X')
      expect(restored.notes).toBe('Valor confirmado externamente.')
      expect(saved.updatedAt).toBeTruthy()
      expect(await db.metadata.get('personal-stock:nicotine-awareness-v2')).toBeTruthy()
    } finally {
      await db.delete()
    }
  })

  it('rejects a custom laboratory profile without an explicit source', async () => {
    const db = makeDatabase()
    try {
      const nicotine = new NicotineAwarenessService(db)
      await expect(nicotine.saveSettings({
        profileId: 'custom-lab',
        customContentMeanMg: '3.500',
        customEmissionMeanMg: '1.000',
        customSourceLabel: '',
        notes: '',
      })).rejects.toThrow('fonte')
    } finally {
      await db.delete()
    }
  })
})
