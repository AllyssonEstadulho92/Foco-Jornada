import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { NicotineAwarenessService } from './NicotineAwarenessService'
import { PersonalStockService } from './PersonalStockService'
import { StickDataProtectionService } from './StickDataProtectionService'
import { StickPackPlannerService } from './StickPackPlannerService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-stick-protection-test-${operationId()}`)
}

describe('StickDataProtectionService', () => {
  it('creates a redundant snapshot with stick movements and veo settings', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      await stock.initializeSticks(20, operationId())
      await stock.consumeStick(operationId())
      await new StickPackPlannerService(db).saveSettings({ packCount: 1, sticksPerPack: 20 })
      await new NicotineAwarenessService(db).saveSettings({
        profileId: 'veo-green-click-2026',
        customContentMeanMg: '',
        customEmissionMeanMg: '',
        customSourceLabel: '',
        notes: 'Green Click',
      })

      const protection = new StickDataProtectionService(db)
      const status = await protection.sync()

      expect(status.available).toBe(true)
      expect(status.valid).toBe(true)
      expect(status.movementCount).toBe(2)
      expect((await protection.status()).source).toBe('current')
    } finally {
      await db.delete()
      localStorage.removeItem('foco-jornada:sticks-protection:v1')
      localStorage.removeItem('foco-jornada:sticks-protection:previous:v1')
    }
  })

  it('recovers sticks from the redundant snapshot only when the local stick entity is missing', async () => {
    const source = makeDatabase()
    const target = makeDatabase()
    try {
      const sourceStock = new PersonalStockService(source)
      await sourceStock.initializeSticks(20, operationId())
      await sourceStock.consumeStick(operationId())
      await new StickPackPlannerService(source).saveSettings({ packCount: 1, sticksPerPack: 20 })
      await new StickDataProtectionService(source).sync()

      const targetProtection = new StickDataProtectionService(target)
      expect(await targetProtection.recoverIfNeeded()).toBe(true)

      const targetStock = new PersonalStockService(target)
      expect((await targetStock.getSticksSummary()).stock).toBe(19)
      expect((await new StickPackPlannerService(target).getSettings()).sticksPerPack).toBe(20)
      expect(await targetProtection.recoverIfNeeded()).toBe(false)
    } finally {
      await source.delete()
      await target.delete()
      localStorage.removeItem('foco-jornada:sticks-protection:v1')
      localStorage.removeItem('foco-jornada:sticks-protection:previous:v1')
    }
  })
})
