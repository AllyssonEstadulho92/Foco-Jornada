import type {
  DoseEventStatus,
  ForecastDose,
  MedicationDoseEvent,
  MedicationForecast,
  StockMovement,
} from '../../domain/personalStock/models'
import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import { minorToDecimal } from './decimal'
import { addCalendarDays, dateKeyInZone, resolveZonedLocalDateTime } from './time'

export type OperationalDoseStatus = Extract<DoseEventStatus, 'not_taken' | 'postponed'>

const INSUFFICIENT_DATA_MESSAGE = 'Não existem dados suficientes para calcular este resultado com precisão.'

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

function compareMovements(left: StockMovement, right: StockMovement): number {
  if (left.sequence !== right.sequence) return left.sequence - right.sequence
  return left.id.localeCompare(right.id)
}

function reconstruct(movements: StockMovement[]): bigint {
  let total = 0n
  ;[...movements].sort(compareMovements).forEach((movement, index) => {
    if (movement.sequence !== index) throw new Error('INCONSISTÊNCIA: sequência do ledger interrompida.')
    if (BigInt(movement.balanceBeforeMinor) !== total) {
      throw new Error('INCONSISTÊNCIA: saldo anterior não coincide com o ledger.')
    }
    total += BigInt(movement.quantityMinor)
    if (total < 0n) throw new Error('INCONSISTÊNCIA: o ledger produz stock negativo.')
    if (BigInt(movement.balanceAfterMinor) !== total) {
      throw new Error('INCONSISTÊNCIA: saldo posterior não coincide com o ledger.')
    }
  })
  return total
}

function activeEvent(events: MedicationDoseEvent[]): MedicationDoseEvent | undefined {
  const correctedIds = new Set(
    events
      .filter((event) => event.status === 'corrected' && event.correctionOf)
      .map((event) => event.correctionOf as string),
  )

  return [...events]
    .filter((event) => event.status !== 'corrected' && !correctedIds.has(event.id))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))[0]
}

function activeEventsByOccurrence(events: MedicationDoseEvent[]): Map<string, MedicationDoseEvent> {
  const correctedIds = new Set(
    events
      .filter((event) => event.status === 'corrected' && event.correctionOf)
      .map((event) => event.correctionOf as string),
  )
  const map = new Map<string, MedicationDoseEvent>()
  for (const event of events) {
    if (event.status === 'corrected' || correctedIds.has(event.id)) continue
    const current = map.get(event.occurrenceKey)
    if (!current || current.createdAt < event.createdAt || (current.createdAt === event.createdAt && current.id < event.id)) {
      map.set(event.occurrenceKey, event)
    }
  }
  return map
}

function statusDescription(status: DoseEventStatus): string {
  if (status === 'taken') return 'tomada'
  if (status === 'not_taken') return 'não tomada'
  if (status === 'postponed') return 'adiada'
  return 'corrigida'
}

export class MedicationDoseStatusService {
  constructor(private readonly db: AppDatabase) {}

  async setMedicationDoseStatus(input: {
    medicationId: string
    scheduleId: string
    onDate: string
    operationId: string
    status: OperationalDoseStatus
    postponedToLocalTime?: string
  }): Promise<{ event: MedicationDoseEvent; duplicated: boolean }> {
    if (!isDateKey(input.onDate)) throw new Error('Data da toma inválida.')
    if (input.status !== 'not_taken' && input.status !== 'postponed') {
      throw new Error('Estado operacional inválido.')
    }
    if (input.status === 'postponed' && !isLocalTime(input.postponedToLocalTime ?? '')) {
      throw new Error('Escolhe a nova hora da toma adiada.')
    }

    let resultEvent: MedicationDoseEvent | null = null
    let duplicated = false

    await this.db.transaction(
      'rw',
      this.db.stockEntities,
      this.db.medicationSchedules,
      this.db.medicationDoseEvents,
      async () => {
        const occurrenceKey = `${input.scheduleId}:${input.onDate}`
        const operationDuplicate = await this.db.medicationDoseEvents.where('operationId').equals(input.operationId).first()
        if (operationDuplicate) {
          if (
            operationDuplicate.medicationId !== input.medicationId
            || operationDuplicate.scheduleId !== input.scheduleId
            || operationDuplicate.occurrenceKey !== occurrenceKey
            || operationDuplicate.status !== input.status
          ) {
            throw new Error('operationId já existe com um conteúdo diferente.')
          }
          resultEvent = operationDuplicate
          duplicated = true
          return
        }

        const medication = await this.db.stockEntities.get(input.medicationId)
        if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')

        const schedule = await this.db.medicationSchedules.get(input.scheduleId)
        if (!schedule || schedule.medicationId !== input.medicationId) throw new Error('Horário não encontrado.')
        if (schedule.effectiveFrom > input.onDate || (schedule.effectiveUntil && schedule.effectiveUntil < input.onDate)) {
          throw new Error('O horário não está válido para esta data.')
        }

        const occurrenceEvents = await this.db.medicationDoseEvents.where('occurrenceKey').equals(occurrenceKey).toArray()
        const current = activeEvent(occurrenceEvents)
        if (current) {
          if (current.status === input.status) {
            resultEvent = current
            duplicated = true
            return
          }
          throw new Error(`Esta toma já está marcada como ${statusDescription(current.status)}. Corrige o estado atual antes de alterar.`)
        }

        const scheduledAt = resolveZonedLocalDateTime(
          input.onDate,
          schedule.localTime,
          medication.timezone,
          schedule.fold,
        )

        let postponedTo: string | undefined
        if (input.status === 'postponed') {
          const postponedAt = resolveZonedLocalDateTime(
            input.onDate,
            input.postponedToLocalTime as string,
            medication.timezone,
            schedule.fold,
          )
          if (postponedAt.getTime() <= scheduledAt.getTime()) {
            throw new Error('A nova hora tem de ser posterior à hora originalmente programada.')
          }
          postponedTo = postponedAt.toISOString()
        }

        const event: MedicationDoseEvent = {
          id: newId(),
          operationId: input.operationId,
          occurrenceKey,
          medicationId: input.medicationId,
          scheduleId: input.scheduleId,
          scheduledAt: scheduledAt.toISOString(),
          quantityMinor: schedule.quantityMinor,
          status: input.status,
          createdAt: new Date().toISOString(),
          postponedTo,
        }
        await this.db.medicationDoseEvents.add(event)
        resultEvent = event
      },
    )

    if (!resultEvent) throw new Error('Não foi possível registar o estado da toma.')
    return { event: resultEvent, duplicated }
  }

  async correctMedicationDoseStatus(
    eventId: string,
    operationId: string,
  ): Promise<{ event: MedicationDoseEvent; duplicated: boolean }> {
    let resultEvent: MedicationDoseEvent | null = null
    let duplicated = false

    await this.db.transaction('rw', this.db.medicationDoseEvents, async () => {
      const target = await this.db.medicationDoseEvents.get(eventId)
      if (!target || (target.status !== 'not_taken' && target.status !== 'postponed')) {
        throw new Error('Estado de toma não encontrado.')
      }

      const operationDuplicate = await this.db.medicationDoseEvents.where('operationId').equals(operationId).first()
      if (operationDuplicate) {
        if (operationDuplicate.status !== 'corrected' || operationDuplicate.correctionOf !== target.id) {
          throw new Error('operationId já existe com um conteúdo diferente.')
        }
        resultEvent = operationDuplicate
        duplicated = true
        return
      }

      const occurrenceEvents = await this.db.medicationDoseEvents.where('occurrenceKey').equals(target.occurrenceKey).toArray()
      const previousCorrection = occurrenceEvents.find(
        (candidate) => candidate.status === 'corrected' && candidate.correctionOf === target.id,
      )
      if (previousCorrection) {
        resultEvent = previousCorrection
        duplicated = true
        return
      }

      const correctionEvent: MedicationDoseEvent = {
        id: newId(),
        operationId,
        occurrenceKey: target.occurrenceKey,
        medicationId: target.medicationId,
        scheduleId: target.scheduleId,
        scheduledAt: target.scheduledAt,
        quantityMinor: target.quantityMinor,
        status: 'corrected',
        createdAt: new Date().toISOString(),
        correctionOf: target.id,
      }
      await this.db.medicationDoseEvents.add(correctionEvent)
      resultEvent = correctionEvent
    })

    if (!resultEvent) throw new Error('Não foi possível corrigir o estado da toma.')
    return { event: resultEvent, duplicated }
  }

  async confirmPostponedMedicationDose(
    eventId: string,
    operationId: string,
  ): Promise<{ event: MedicationDoseEvent; duplicated: boolean; stock: string }> {
    let resultEvent: MedicationDoseEvent | null = null
    let duplicated = false
    let resultStock = ''

    await this.db.transaction(
      'rw',
      this.db.stockEntities,
      this.db.stockMovements,
      this.db.medicationSchedules,
      this.db.medicationDoseEvents,
      async () => {
        const target = await this.db.medicationDoseEvents.get(eventId)
        if (!target || target.status !== 'postponed') throw new Error('Toma adiada não encontrada.')
        if (!target.postponedTo) throw new Error('A toma adiada não tem uma nova hora definida. Corrige o estado e volta a adiá-la.')

        const occurrenceEvents = await this.db.medicationDoseEvents.where('occurrenceKey').equals(target.occurrenceKey).toArray()
        const previousTaken = occurrenceEvents.find(
          (candidate) => candidate.status === 'taken' && candidate.rescheduledFrom === target.id,
        )
        if (previousTaken) {
          resultEvent = previousTaken
          duplicated = true
          const movements = await this.db.stockMovements.where('entityId').equals(target.medicationId).toArray()
          resultStock = minorToDecimal(reconstruct(movements))
          return
        }

        const current = activeEvent(occurrenceEvents)
        if (!current || current.id !== target.id) {
          throw new Error('A toma adiada já foi corrigida ou substituída por outro estado.')
        }

        const medication = await this.db.stockEntities.get(target.medicationId)
        if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')

        const movementDuplicate = await this.db.stockMovements.where('operationId').equals(operationId).first()
        const eventDuplicate = await this.db.medicationDoseEvents.where('operationId').equals(operationId).first()
        if (movementDuplicate || eventDuplicate) {
          throw new Error('INCONSISTÊNCIA: confirmação reagendada parcialmente duplicada.')
        }

        const movements = (await this.db.stockMovements.where('entityId').equals(target.medicationId).toArray()).sort(compareMovements)
        const before = reconstruct(movements)
        const quantity = BigInt(target.quantityMinor)
        const after = before - quantity
        if (after < 0n) throw new Error('Stock insuficiente para esta toma.')

        const now = new Date().toISOString()
        const movement: StockMovement = {
          id: newId(),
          operationId,
          entityId: target.medicationId,
          type: 'consumption',
          quantityMinor: (-quantity).toString(),
          balanceBeforeMinor: before.toString(),
          balanceAfterMinor: after.toString(),
          sequence: movements.length,
          effectiveAt: now,
          createdAt: now,
        }
        await this.db.stockMovements.add(movement)

        const correctionEvent: MedicationDoseEvent = {
          id: newId(),
          operationId: `${operationId}:postponement`,
          occurrenceKey: target.occurrenceKey,
          medicationId: target.medicationId,
          scheduleId: target.scheduleId,
          scheduledAt: target.scheduledAt,
          quantityMinor: target.quantityMinor,
          status: 'corrected',
          createdAt: now,
          correctionOf: target.id,
        }
        await this.db.medicationDoseEvents.add(correctionEvent)

        const takenEvent: MedicationDoseEvent = {
          id: newId(),
          operationId,
          occurrenceKey: target.occurrenceKey,
          medicationId: target.medicationId,
          scheduleId: target.scheduleId,
          scheduledAt: target.postponedTo,
          quantityMinor: target.quantityMinor,
          status: 'taken',
          createdAt: new Date(Date.now() + 1).toISOString(),
          stockMovementId: movement.id,
          rescheduledFrom: target.id,
        }
        await this.db.medicationDoseEvents.add(takenEvent)

        const verified = reconstruct(await this.db.stockMovements.where('entityId').equals(target.medicationId).toArray())
        if (verified !== after) throw new Error('INCONSISTÊNCIA: o ledger não reconstrói o saldo após a toma.')
        resultEvent = takenEvent
        resultStock = minorToDecimal(after)
      },
    )

    if (!resultEvent) throw new Error('Não foi possível confirmar a toma adiada.')
    return { event: resultEvent, duplicated, stock: resultStock }
  }

  async forecastMedication(medicationId: string, now = new Date()): Promise<MedicationForecast> {
    const medication = await this.db.stockEntities.get(medicationId)
    if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')

    const [allSchedules, events, movements] = await Promise.all([
      this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray(),
      this.db.medicationDoseEvents.where('medicationId').equals(medicationId).toArray(),
      this.db.stockMovements.where('entityId').equals(medicationId).toArray(),
    ])
    if (!allSchedules.length) throw new Error(INSUFFICIENT_DATA_MESSAGE)

    const activeEvents = activeEventsByOccurrence(events)
    for (const event of activeEvents.values()) {
      if (event.status !== 'postponed') continue
      if (!event.postponedTo) {
        throw new Error('Não é possível calcular a autonomia exata: existe uma toma adiada sem nova hora definida.')
      }
      if (new Date(event.postponedTo).getTime() <= now.getTime()) {
        throw new Error('Não é possível calcular a autonomia exata: existe uma toma adiada ainda por confirmar.')
      }
    }

    let remaining = reconstruct(movements)
    let currentDate = dateKeyInZone(now, medication.timezone)
    let nextDose: ForecastDose | null = null
    let lastPossibleDose: ForecastDose | null = null
    let stockAfterLastPossible = remaining

    for (let dayOffset = 0; dayOffset < 36_600; dayOffset += 1) {
      if (dayOffset > 0) currentDate = addCalendarDays(currentDate, 1)
      const candidates = allSchedules
        .filter((schedule) => schedule.effectiveFrom <= currentDate && (!schedule.effectiveUntil || schedule.effectiveUntil >= currentDate))
        .map((schedule) => {
          const occurrenceKey = `${schedule.id}:${currentDate}`
          const event = activeEvents.get(occurrenceKey)
          if (event?.status === 'taken' || event?.status === 'not_taken') return null
          const at = event?.status === 'postponed' && event.postponedTo
            ? new Date(event.postponedTo)
            : resolveZonedLocalDateTime(currentDate, schedule.localTime, medication.timezone, schedule.fold)
          return { schedule, at }
        })
        .filter((item): item is { schedule: (typeof allSchedules)[number]; at: Date } => Boolean(item) && item.at.getTime() > now.getTime())
        .sort((left, right) => left.at.getTime() - right.at.getTime() || left.schedule.order - right.schedule.order || left.schedule.id.localeCompare(right.schedule.id))

      for (const item of candidates) {
        const dose: ForecastDose = {
          scheduleId: item.schedule.id,
          scheduledAt: item.at.toISOString(),
          quantity: minorToDecimal(item.schedule.quantityMinor),
        }
        if (!nextDose) nextDose = dose
        const quantity = BigInt(item.schedule.quantityMinor)
        if (remaining < quantity) {
          if (!nextDose) throw new Error(INSUFFICIENT_DATA_MESSAGE)
          return {
            nextDose,
            lastPossibleDose,
            stockAfterLastPossible: minorToDecimal(stockAfterLastPossible),
            firstImpossibleDose: dose,
            missingQuantity: minorToDecimal(quantity - remaining),
            autonomySeconds: Math.max(0, Math.floor((item.at.getTime() - now.getTime()) / 1000)),
            exact: true,
          }
        }
        remaining -= quantity
        stockAfterLastPossible = remaining
        lastPossibleDose = dose
      }
    }

    throw new Error(INSUFFICIENT_DATA_MESSAGE)
  }
}
