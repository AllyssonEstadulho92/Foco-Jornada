import type { MedicationSchedule } from '../../domain/personalStock/models'
import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import { parsePositiveDecimal } from './decimal'
import { addCalendarDays } from './time'

function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isLocalTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export class MedicationScheduleService {
  constructor(private readonly db: AppDatabase) {}

  async defineFromDate(input: {
    medicationId: string
    scheduleId: string
    localTime: string
    quantity: string
    effectiveFrom: string
  }): Promise<{ previous: MedicationSchedule; replacement: MedicationSchedule; changed: boolean }> {
    if (!isLocalTime(input.localTime)) throw new Error('Hora inválida. Usa HH:MM.')
    if (!isDateKey(input.effectiveFrom)) throw new Error('Data de início inválida.')
    const quantityMinor = parsePositiveDecimal(input.quantity).toString()
    const effectiveUntil = addCalendarDays(input.effectiveFrom, -1)

    return this.db.transaction('rw', this.db.stockEntities, this.db.medicationSchedules, async () => {
      const medication = await this.db.stockEntities.get(input.medicationId)
      if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')

      const current = await this.db.medicationSchedules.get(input.scheduleId)
      if (!current || current.medicationId !== input.medicationId) throw new Error('Horário não encontrado.')
      if (current.deletedAt) throw new Error('Este horário foi eliminado e já não pode ser alterado.')
      if (current.effectiveFrom > effectiveUntil) {
        throw new Error('A nova definição tem de começar depois do início do horário atual.')
      }

      const schedules = await this.db.medicationSchedules.where('medicationId').equals(input.medicationId).toArray()
      const successor = schedules.find((schedule) => (
        schedule.id !== current.id
        && !schedule.deletedAt
        && schedule.order === current.order
        && schedule.effectiveFrom === input.effectiveFrom
      ))

      if (
        current.effectiveUntil === effectiveUntil
        && successor
        && successor.localTime === input.localTime
        && successor.quantityMinor === quantityMinor
        && successor.fold === current.fold
      ) {
        return { previous: current, replacement: successor, changed: false }
      }
      if (successor) {
        throw new Error('Já existe uma nova definição deste horário para essa data.')
      }
      if (current.effectiveUntil && current.effectiveUntil < effectiveUntil) {
        throw new Error('Este horário já terminou antes da nova data definida.')
      }

      const replacement: MedicationSchedule = {
        id: newId(),
        medicationId: current.medicationId,
        localTime: input.localTime,
        quantityMinor,
        effectiveFrom: input.effectiveFrom,
        order: current.order,
        fold: current.fold,
        createdAt: new Date().toISOString(),
      }

      await this.db.medicationSchedules.update(current.id, { effectiveUntil })
      await this.db.medicationSchedules.add(replacement)

      return {
        previous: { ...current, effectiveUntil },
        replacement,
        changed: true,
      }
    })
  }

  async deleteSchedule(input: {
    medicationId: string
    scheduleId: string
    deletedOnDate: string
  }): Promise<{ schedule: MedicationSchedule; changed: boolean; removedCount: number }> {
    if (!isDateKey(input.deletedOnDate)) throw new Error('Data de eliminação inválida.')

    return this.db.transaction('rw', this.db.stockEntities, this.db.medicationSchedules, async () => {
      const medication = await this.db.stockEntities.get(input.medicationId)
      if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')

      const current = await this.db.medicationSchedules.get(input.scheduleId)
      if (!current || current.medicationId !== input.medicationId) throw new Error('Horário não encontrado.')
      if (current.deletedAt) return { schedule: current, changed: false, removedCount: 0 }

      const deletedAt = new Date().toISOString()
      const effectiveUntil = addCalendarDays(input.deletedOnDate, -1)
      const schedules = await this.db.medicationSchedules.where('medicationId').equals(input.medicationId).toArray()
      const targets = schedules.filter((schedule) => (
        schedule.order === current.order
        && !schedule.deletedAt
        && schedule.effectiveFrom >= current.effectiveFrom
      ))

      for (const target of targets) {
        await this.db.medicationSchedules.update(target.id, { effectiveUntil, deletedAt })
      }

      return {
        schedule: { ...current, effectiveUntil, deletedAt },
        changed: targets.length > 0,
        removedCount: targets.length,
      }
    })
  }

  async endOnDate(input: {
    medicationId: string
    scheduleId: string
    effectiveUntil: string
  }): Promise<{ schedule: MedicationSchedule; changed: boolean; removedCount: number }> {
    return this.deleteSchedule({
      medicationId: input.medicationId,
      scheduleId: input.scheduleId,
      deletedOnDate: input.effectiveUntil,
    })
  }
}