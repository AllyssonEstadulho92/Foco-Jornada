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

  it('archives the active stick cycle before clearing it and does not auto-recover the cleared cycle', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const planner = new StickPackPlannerService(db)
      const nicotine = new NicotineAwarenessService(db)
      const protection = new StickDataProtectionService(db)

      await planner.saveSettings({ packCount: 2, sticksPerPack: 20 })
      await nicotine.saveSettings({
        profileId: 'veo-green-click-2026',
        customContentMeanMg: '',
        customEmissionMeanMg: '',
        customSourceLabel: '',
        notes: 'Ciclo antigo',
      })
      await stock.initializeSticks(40, operationId())
      await stock.consumeStick(operationId())
      await protection.sync()

      const reset = await protection.archiveAndReset()

      expect(reset.archiveKey).toMatch(/^personal-stock:sticks-reset-archive:/)
      expect(reset.archivedMovementCount).toBe(2)
      expect(await db.stockEntities.get('stock:sticks:glo')).toBeUndefined()
      expect(await db.stockMovements.where('entityId').equals('stock:sticks:glo').count()).toBe(0)
      expect(await db.metadata.get('personal-stock:stick-pack-planner-v1')).toBeUndefined()
      expect(await db.metadata.get('personal-stock:nicotine-awareness-v2')).toBeUndefined()
      expect(reset.archiveKey ? await db.metadata.get(reset.archiveKey) : undefined).toBeTruthy()

      const redundant = await protection.status()
      expect(redundant.valid).toBe(true)
      expect(redundant.movementCount).toBe(0)
      expect(await protection.recoverIfNeeded()).toBe(false)
      expect((await stock.getSticksSummary()).initialized).toBe(false)
    } finally {
      await db.delete()
      localStorage.removeItem('foco-jornada:sticks-protection:v1')
      localStorage.removeItem('foco-jornada:sticks-protection:previous:v1')
    }
  })

  it('keeps medication records untouched when the stick control is reset', async () => {
    const db = makeDatabase()
    try {
      const stock = new PersonalStockService(db)
      const protection = new StickDataProtectionService(db)

      const medicationId = operationId()
      await stock.createMedication({
        medicationId,
        operationId: operationId(),
        name: 'Medicamento preservado',
        dosage: '10 mg',
        unit: 'comprimidos',
        initialStock: '30',
        startDate: '2026-08-28',
      })
      await stock.initializeSticks(20, operationId())
      await stock.consumeStick(operationId())

      await protection.archiveAndReset()

      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('30')
      expect((await stock.listMedications()).map((item) => item.medication.id)).toContain(medicationId)
      expect((await stock.getSticksSummary()).initialized).toBe(false)
    } finally {
      await db.delete()
      localStorage.removeItem('foco-jornada:sticks-protection:v1')
      localStorage.removeItem('foco-jornada:sticks-protection:previous:v1')
    }
  })

})
