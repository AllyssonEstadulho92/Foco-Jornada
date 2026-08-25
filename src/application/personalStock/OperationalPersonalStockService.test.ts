import { describe, expect, it } from 'vitest'
import { AppDatabase } from '../../infrastructure/database/appDatabase'
import { MedicationDoseStatusService } from './MedicationDoseStatusService'
import { OperationalPersonalStockService } from './OperationalPersonalStockService'

function operationId(): string {
  return globalThis.crypto.randomUUID()
}

function makeDatabase(): AppDatabase {
  return new AppDatabase(`foco-jornada-operational-stock-test-${operationId()}`)
}

async function prepareMedication(db: AppDatabase) {
  const stock = new OperationalPersonalStockService(db)
  const medicationId = operationId()
  await stock.createMedication({
    medicationId,
    operationId: operationId(),
    name: 'Teste',
    dosage: '100 mg',
    unit: 'comprimidos',
    initialStock: '5',
    startDate: '2026-08-25',
  })
  const schedule = await stock.addMedicationSchedule({
    medicationId,
    localTime: '08:00',
    quantity: '1',
    effectiveFrom: '2026-08-25',
  })
  return { stock, medicationId, schedule }
}

describe('OperationalPersonalStockService', () => {
  it('bloqueia confirmação de uma toma enquanto estiver marcada como não tomada', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await prepareMedication(db)
      const statuses = new MedicationDoseStatusService(db)
      const notTaken = await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'not_taken',
      })

      await expect(stock.confirmMedicationDose({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
      })).rejects.toThrow('já está marcada como não tomada')
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('5')

      await statuses.correctMedicationDoseStatus(notTaken.event.id, operationId())
      const confirmed = await stock.confirmMedicationDose({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
      })
      expect(confirmed.stock).toBe('4')
      expect(confirmed.event.status).toBe('taken')
    } finally {
      await db.delete()
    }
  })

  it('bloqueia a confirmação no horário original enquanto a toma estiver adiada', async () => {
    const db = makeDatabase()
    try {
      const { stock, medicationId, schedule } = await prepareMedication(db)
      const statuses = new MedicationDoseStatusService(db)
      await statuses.setMedicationDoseStatus({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
        status: 'postponed',
        postponedToLocalTime: '10:00',
      })

      await expect(stock.confirmMedicationDose({
        medicationId,
        scheduleId: schedule.id,
        onDate: '2026-08-25',
        operationId: operationId(),
      })).rejects.toThrow('já está marcada como adiada')
      expect((await stock.getMedicationSummary(medicationId)).stock).toBe('5')
    } finally {
      await db.delete()
    }
  })
})
