import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import type {
  ForecastDose,
  MedicationDoseEvent,
  MedicationForecast,
  MedicationSchedule,
  MedicationSummary,
  ReconciliationResult,
  StickSummary,
  StockEntity,
  StockMovement,
  StockMovementType,
} from '../../domain/personalStock/models'
import {
  MEDICATION_SCALE,
  minorToDecimal,
  parsePositiveDecimal,
  parsePositiveStickInteger,
} from './decimal'
import { addCalendarDays, dateKeyInZone, resolveZonedLocalDateTime } from './time'

export const STICKS_ENTITY_ID = 'stock:sticks:glo'
export const STOCK_TIMEZONE = 'Europe/Lisbon'
export const INSUFFICIENT_DATA_MESSAGE = 'Não existem dados suficientes para calcular este resultado com precisão.'

function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function dateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function localTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function movementScale(entity: StockEntity): number {
  return entity.kind === 'sticks' ? 0 : MEDICATION_SCALE
}

function compareMovements(left: StockMovement, right: StockMovement): number {
  if (left.sequence !== right.sequence) return left.sequence - right.sequence
  return left.id.localeCompare(right.id)
}

export class PersonalStockService {
  constructor(private readonly db: AppDatabase) {}

  private async movementsFor(entityId: string): Promise<StockMovement[]> {
    const movements = await this.db.stockMovements.where('entityId').equals(entityId).toArray()
    return movements.sort(compareMovements)
  }

  private reconstruct(movements: StockMovement[]): bigint {
    let total = 0n
    movements.sort(compareMovements).forEach((movement, index) => {
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

  private reconciliationFrom(movements: StockMovement[]): ReconciliationResult {
    const reconstructed = this.reconstruct([...movements])
    const stored = movements.length ? BigInt(movements[movements.length - 1].balanceAfterMinor) : 0n
    return {
      storedMinor: stored.toString(),
      reconstructedMinor: reconstructed.toString(),
      movementCount: movements.length,
      ok: stored === reconstructed,
    }
  }

  async reconcile(entityId: string): Promise<ReconciliationResult> {
    return this.reconciliationFrom(await this.movementsFor(entityId))
  }

  private validateMovementPayload(type: StockMovementType, quantity: bigint, correctionOf?: string) {
    if (quantity === 0n) throw new Error('Um movimento não pode ter quantidade zero.')
    if (type === 'consumption' && quantity >= 0n) throw new Error('Um consumo deve ser negativo.')
    if ((type === 'initial_stock' || type === 'restock') && quantity <= 0n) {
      throw new Error('Uma entrada de stock deve ser positiva.')
    }
    if (type !== 'correction' && correctionOf) throw new Error('correctionOf só é válido em correções.')
  }

  private async appendMovement(
    entity: StockEntity,
    operationId: string,
    type: StockMovementType,
    quantity: bigint,
    options: { correctionOf?: string; effectiveAt?: Date } = {},
  ): Promise<{ movement: StockMovement; duplicated: boolean }> {
    this.validateMovementPayload(type, quantity, options.correctionOf)

    const duplicate = await this.db.stockMovements.where('operationId').equals(operationId).first()
    if (duplicate) {
      if (
        duplicate.entityId !== entity.id
        || duplicate.type !== type
        || BigInt(duplicate.quantityMinor) !== quantity
        || duplicate.correctionOf !== options.correctionOf
      ) {
        throw new Error('operationId já existe com um conteúdo diferente.')
      }
      return { movement: duplicate, duplicated: true }
    }

    const movements = await this.movementsFor(entity.id)
    const before = this.reconstruct([...movements])
    if (type === 'initial_stock' && movements.length !== 0) {
      throw new Error('O stock inicial só pode ser o primeiro movimento.')
    }
    const after = before + quantity
    if (after < 0n) throw new Error('Stock insuficiente para esta operação.')

    const now = new Date()
    const movement: StockMovement = {
      id: newId(),
      operationId,
      entityId: entity.id,
      type,
      quantityMinor: quantity.toString(),
      balanceBeforeMinor: before.toString(),
      balanceAfterMinor: after.toString(),
      sequence: movements.length,
      effectiveAt: (options.effectiveAt ?? now).toISOString(),
      createdAt: now.toISOString(),
      correctionOf: options.correctionOf,
    }
    await this.db.stockMovements.add(movement)

    const verified = this.reconstruct(await this.movementsFor(entity.id))
    if (verified !== after) throw new Error('INCONSISTÊNCIA: o ledger não reconstrói o novo saldo.')
    return { movement, duplicated: false }
  }

  async getSticksSummary(now = new Date()): Promise<StickSummary> {
    const entity = await this.db.stockEntities.get(STICKS_ENTITY_ID)
    if (!entity) {
      return {
        initialized: false,
        stock: null,
        usedToday: null,
        storedMinor: '0',
        reconstructedMinor: '0',
        movementCount: 0,
        ok: true,
      }
    }

    const movements = await this.movementsFor(STICKS_ENTITY_ID)
    const reconciliation = this.reconciliationFrom([...movements])
    if (!reconciliation.ok) throw new Error('INCONSISTÊNCIA: stock guardado e reconstruído divergem.')

    const corrections = new Map<string, bigint>()
    for (const movement of movements) {
      if (!movement.correctionOf) continue
      corrections.set(
        movement.correctionOf,
        (corrections.get(movement.correctionOf) ?? 0n) + BigInt(movement.quantityMinor),
      )
    }

    const today = dateKeyInZone(now, STOCK_TIMEZONE)
    let usedToday = 0n
    for (const movement of movements) {
      if (movement.type !== 'consumption') continue
      if (dateKeyInZone(new Date(movement.effectiveAt), STOCK_TIMEZONE) !== today) continue
      const net = BigInt(movement.quantityMinor) + (corrections.get(movement.id) ?? 0n)
      if (net < 0n) usedToday += -net
    }

    return {
      initialized: movements.length > 0,
      stock: Number(BigInt(reconciliation.reconstructedMinor)),
      usedToday: Number(usedToday),
      ...reconciliation,
    }
  }

  async initializeSticks(quantity: number, operationId: string): Promise<{ duplicated: boolean; summary: StickSummary }> {
    const amount = parsePositiveStickInteger(quantity)
    let duplicated = false
    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      let entity = await this.db.stockEntities.get(STICKS_ENTITY_ID)
      if (!entity) {
        entity = {
          id: STICKS_ENTITY_ID,
          kind: 'sticks',
          name: 'Sticks glo',
          unit: 'stick',
          timezone: STOCK_TIMEZONE,
          createdAt: new Date().toISOString(),
        }
        await this.db.stockEntities.add(entity)
      }
      const result = await this.appendMovement(entity, operationId, 'initial_stock', amount)
      duplicated = result.duplicated
    })
    return { duplicated, summary: await this.getSticksSummary() }
  }

  async restockSticks(quantity: number, operationId: string): Promise<{ duplicated: boolean; summary: StickSummary }> {
    const amount = parsePositiveStickInteger(quantity)
    let duplicated = false
    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      const entity = await this.db.stockEntities.get(STICKS_ENTITY_ID)
      if (!entity) throw new Error('Define primeiro o stock inicial de sticks.')
      const result = await this.appendMovement(entity, operationId, 'restock', amount)
      duplicated = result.duplicated
    })
    return { duplicated, summary: await this.getSticksSummary() }
  }

  async consumeStick(operationId: string): Promise<{ duplicated: boolean; summary: StickSummary }> {
    let duplicated = false
    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      const entity = await this.db.stockEntities.get(STICKS_ENTITY_ID)
      if (!entity) throw new Error('Define primeiro o stock inicial de sticks.')
      const result = await this.appendMovement(entity, operationId, 'consumption', -1n)
      duplicated = result.duplicated
    })
    return { duplicated, summary: await this.getSticksSummary() }
  }

  async undoLastStick(operationId: string): Promise<{ duplicated: boolean; summary: StickSummary }> {
    let duplicated = false
    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      const entity = await this.db.stockEntities.get(STICKS_ENTITY_ID)
      if (!entity) throw new Error('Não existe stock de sticks.')

      const duplicate = await this.db.stockMovements.where('operationId').equals(operationId).first()
      if (duplicate) {
        if (duplicate.entityId !== STICKS_ENTITY_ID || duplicate.type !== 'correction') {
          throw new Error('operationId já existe com um conteúdo diferente.')
        }
        duplicated = true
        return
      }

      const movements = await this.movementsFor(STICKS_ENTITY_ID)
      const corrections = new Map<string, bigint>()
      for (const movement of movements) {
        if (!movement.correctionOf) continue
        corrections.set(
          movement.correctionOf,
          (corrections.get(movement.correctionOf) ?? 0n) + BigInt(movement.quantityMinor),
        )
      }

      const target = [...movements].reverse().find((movement) => {
        if (movement.type !== 'consumption') return false
        return BigInt(movement.quantityMinor) + (corrections.get(movement.id) ?? 0n) < 0n
      })
      if (!target) throw new Error('Não existe utilização para desfazer.')

      const outstanding = BigInt(target.quantityMinor) + (corrections.get(target.id) ?? 0n)
      const result = await this.appendMovement(entity, operationId, 'correction', -outstanding, {
        correctionOf: target.id,
      })
      duplicated = result.duplicated
    })
    return { duplicated, summary: await this.getSticksSummary() }
  }

  async listStickMovements(limit = 50): Promise<StockMovement[]> {
    const movements = await this.movementsFor(STICKS_ENTITY_ID)
    return movements.slice(-limit).reverse()
  }

  async createMedication(input: {
    name: string
    dosage: string
    unit: string
    initialStock: string
    startDate: string
    operationId: string
    medicationId?: string
    timezone?: string
  }): Promise<MedicationSummary> {
    const name = input.name.trim()
    const dosage = input.dosage.trim()
    const unit = input.unit.trim()
    if (!name || !dosage || !unit) throw new Error('Nome, dosagem e unidade são obrigatórios.')
    if (!dateKey(input.startDate)) throw new Error('Data de início inválida.')
    const amount = parsePositiveDecimal(input.initialStock)
    const medicationId = input.medicationId ?? newId()
    const timezone = input.timezone ?? STOCK_TIMEZONE

    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      const existingMovement = await this.db.stockMovements.where('operationId').equals(input.operationId).first()
      if (existingMovement) {
        if (existingMovement.entityId !== medicationId || BigInt(existingMovement.quantityMinor) !== amount) {
          throw new Error('operationId já existe com um conteúdo diferente.')
        }
        return
      }
      if (await this.db.stockEntities.get(medicationId)) throw new Error('O medicamento já existe.')
      const entity: StockEntity = {
        id: medicationId,
        kind: 'medication',
        name,
        dosage,
        unit,
        timezone,
        startDate: input.startDate,
        createdAt: new Date().toISOString(),
      }
      await this.db.stockEntities.add(entity)
      await this.appendMovement(entity, input.operationId, 'initial_stock', amount)
    })
    return this.getMedicationSummary(medicationId)
  }

  async listMedications(): Promise<MedicationSummary[]> {
    const entities = (await this.db.stockEntities.where('kind').equals('medication').toArray())
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    return Promise.all(entities.map((entity) => this.getMedicationSummary(entity.id)))
  }

  async getMedicationSummary(medicationId: string): Promise<MedicationSummary> {
    const medication = await this.db.stockEntities.get(medicationId)
    if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')
    const movements = await this.movementsFor(medicationId)
    const reconciliation = this.reconciliationFrom([...movements])
    if (!reconciliation.ok) throw new Error('INCONSISTÊNCIA: stock guardado e reconstruído divergem.')
    return {
      medication,
      stock: minorToDecimal(reconciliation.reconstructedMinor),
      ...reconciliation,
    }
  }

  async restockMedication(medicationId: string, quantity: string, operationId: string): Promise<MedicationSummary> {
    const amount = parsePositiveDecimal(quantity)
    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      const medication = await this.db.stockEntities.get(medicationId)
      if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')
      await this.appendMovement(medication, operationId, 'restock', amount)
    })
    return this.getMedicationSummary(medicationId)
  }

  async addMedicationSchedule(input: {
    medicationId: string
    localTime: string
    quantity: string
    effectiveFrom: string
    effectiveUntil?: string
    order?: number
    fold?: 0 | 1
  }): Promise<MedicationSchedule> {
    if (!localTime(input.localTime)) throw new Error('Hora inválida. Usa HH:MM.')
    if (!dateKey(input.effectiveFrom)) throw new Error('Data inicial inválida.')
    if (input.effectiveUntil && !dateKey(input.effectiveUntil)) throw new Error('Data final inválida.')
    if (input.effectiveUntil && input.effectiveUntil < input.effectiveFrom) {
      throw new Error('A data final não pode ser anterior à data inicial.')
    }
    const amount = parsePositiveDecimal(input.quantity)
    const medication = await this.db.stockEntities.get(input.medicationId)
    if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')
    const schedules = await this.db.medicationSchedules.where('medicationId').equals(input.medicationId).toArray()
    const order = input.order ?? (schedules.length ? Math.max(...schedules.map((item) => item.order)) + 1 : 0)
    if (!Number.isSafeInteger(order) || order < 0) throw new Error('Ordem de horário inválida.')

    const schedule: MedicationSchedule = {
      id: newId(),
      medicationId: input.medicationId,
      localTime: input.localTime,
      quantityMinor: amount.toString(),
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil,
      order,
      fold: input.fold,
      createdAt: new Date().toISOString(),
    }
    await this.db.medicationSchedules.add(schedule)
    return schedule
  }

  async schedulesForDate(medicationId: string, onDate: string): Promise<MedicationSchedule[]> {
    return (await this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray())
      .filter((schedule) => schedule.effectiveFrom <= onDate && (!schedule.effectiveUntil || schedule.effectiveUntil >= onDate))
      .sort((a, b) => a.localTime.localeCompare(b.localTime) || a.order - b.order || a.id.localeCompare(b.id))
  }

  async listDoseEvents(medicationId: string): Promise<MedicationDoseEvent[]> {
    const events = await this.db.medicationDoseEvents.where('medicationId').equals(medicationId).toArray()
    return events.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.createdAt.localeCompare(b.createdAt))
  }

  async confirmMedicationDose(input: {
    medicationId: string
    scheduleId: string
    onDate: string
    operationId: string
  }): Promise<{ event: MedicationDoseEvent; duplicated: boolean; stock: string }> {
    if (!dateKey(input.onDate)) throw new Error('Data da toma inválida.')
    let resultEvent: MedicationDoseEvent | null = null
    let duplicated = false

    await this.db.transaction(
      'rw',
      this.db.stockEntities,
      this.db.stockMovements,
      this.db.medicationSchedules,
      this.db.medicationDoseEvents,
      async () => {
        const medication = await this.db.stockEntities.get(input.medicationId)
        if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')
        const schedule = await this.db.medicationSchedules.get(input.scheduleId)
        if (!schedule || schedule.medicationId !== input.medicationId) throw new Error('Horário não encontrado.')
        if (schedule.effectiveFrom > input.onDate || (schedule.effectiveUntil && schedule.effectiveUntil < input.onDate)) {
          throw new Error('O horário não está válido para esta data.')
        }

        const operationDuplicate = await this.db.medicationDoseEvents.where('operationId').equals(input.operationId).first()
        if (operationDuplicate) {
          if (
            operationDuplicate.medicationId !== input.medicationId
            || operationDuplicate.scheduleId !== input.scheduleId
            || operationDuplicate.occurrenceKey !== `${input.scheduleId}:${input.onDate}`
          ) {
            throw new Error('operationId já existe com um conteúdo diferente.')
          }
          resultEvent = operationDuplicate
          duplicated = true
          return
        }

        const occurrenceKey = `${input.scheduleId}:${input.onDate}`
        const occurrenceEvents = await this.db.medicationDoseEvents.where('occurrenceKey').equals(occurrenceKey).toArray()
        const correctedIds = new Set(
          occurrenceEvents.filter((event) => event.status === 'corrected' && event.correctionOf).map((event) => event.correctionOf),
        )
        const previousTaken = occurrenceEvents.find((event) => event.status === 'taken' && !correctedIds.has(event.id))
        if (previousTaken) {
          resultEvent = previousTaken
          duplicated = true
          return
        }

        const scheduledAt = resolveZonedLocalDateTime(
          input.onDate,
          schedule.localTime,
          medication.timezone,
          schedule.fold,
        )
        const quantity = BigInt(schedule.quantityMinor)
        const movementResult = await this.appendMovement(
          medication,
          input.operationId,
          'consumption',
          -quantity,
          { effectiveAt: new Date() },
        )
        if (movementResult.duplicated) {
          throw new Error('INCONSISTÊNCIA: movimento de toma existe sem evento correspondente.')
        }

        const event: MedicationDoseEvent = {
          id: newId(),
          operationId: input.operationId,
          occurrenceKey,
          medicationId: input.medicationId,
          scheduleId: input.scheduleId,
          scheduledAt: scheduledAt.toISOString(),
          quantityMinor: quantity.toString(),
          status: 'taken',
          createdAt: new Date().toISOString(),
          stockMovementId: movementResult.movement.id,
        }
        await this.db.medicationDoseEvents.add(event)
        resultEvent = event
      },
    )

    if (!resultEvent) throw new Error('Não foi possível confirmar a toma.')
    const summary = await this.getMedicationSummary(input.medicationId)
    return { event: resultEvent, duplicated, stock: summary.stock }
  }

  async undoMedicationDose(eventId: string, operationId: string): Promise<MedicationSummary> {
    await this.db.transaction(
      'rw',
      this.db.stockEntities,
      this.db.stockMovements,
      this.db.medicationDoseEvents,
      async () => {
        const event = await this.db.medicationDoseEvents.get(eventId)
        if (!event || event.status !== 'taken' || !event.stockMovementId) throw new Error('Toma não encontrada.')
        const medication = await this.db.stockEntities.get(event.medicationId)
        if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')

        const previousCorrection = (await this.db.medicationDoseEvents.where('occurrenceKey').equals(event.occurrenceKey).toArray())
          .find((candidate) => candidate.status === 'corrected' && candidate.correctionOf === event.id)
        if (previousCorrection) return

        const movement = await this.db.stockMovements.get(event.stockMovementId)
        if (!movement || movement.type !== 'consumption') throw new Error('INCONSISTÊNCIA: movimento da toma não encontrado.')
        const correction = await this.appendMovement(
          medication,
          operationId,
          'correction',
          BigInt(event.quantityMinor),
          { correctionOf: movement.id },
        )
        if (correction.duplicated) return

        const correctionEvent: MedicationDoseEvent = {
          id: newId(),
          operationId,
          occurrenceKey: event.occurrenceKey,
          medicationId: event.medicationId,
          scheduleId: event.scheduleId,
          scheduledAt: event.scheduledAt,
          quantityMinor: event.quantityMinor,
          status: 'corrected',
          createdAt: new Date().toISOString(),
          correctionOf: event.id,
          stockMovementId: correction.movement.id,
        }
        await this.db.medicationDoseEvents.add(correctionEvent)
      },
    )
    const event = await this.db.medicationDoseEvents.get(eventId)
    if (!event) throw new Error('Toma não encontrada.')
    return this.getMedicationSummary(event.medicationId)
  }

  async forecastMedication(medicationId: string, now = new Date()): Promise<MedicationForecast> {
    const medication = await this.db.stockEntities.get(medicationId)
    if (!medication || medication.kind !== 'medication') throw new Error('Medicamento não encontrado.')
    const allSchedules = await this.db.medicationSchedules.where('medicationId').equals(medicationId).toArray()
    if (!allSchedules.length) throw new Error(INSUFFICIENT_DATA_MESSAGE)

    const reconciliation = await this.reconcile(medicationId)
    if (!reconciliation.ok) throw new Error('INCONSISTÊNCIA: stock guardado e reconstruído divergem.')
    let remaining = BigInt(reconciliation.reconstructedMinor)
    let currentDate = dateKeyInZone(now, medication.timezone)
    let nextDose: ForecastDose | null = null
    let lastPossibleDose: ForecastDose | null = null
    let stockAfterLastPossible = remaining

    for (let dayOffset = 0; dayOffset < 36_600; dayOffset += 1) {
      if (dayOffset > 0) currentDate = addCalendarDays(currentDate, 1)
      const schedules = allSchedules
        .filter((schedule) => schedule.effectiveFrom <= currentDate && (!schedule.effectiveUntil || schedule.effectiveUntil >= currentDate))
        .map((schedule) => ({
          schedule,
          at: resolveZonedLocalDateTime(currentDate, schedule.localTime, medication.timezone, schedule.fold),
        }))
        .filter((item) => item.at.getTime() > now.getTime())
        .sort((a, b) => a.at.getTime() - b.at.getTime() || a.schedule.order - b.schedule.order || a.schedule.id.localeCompare(b.schedule.id))

      for (const item of schedules) {
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

  async diagnostic(): Promise<{
    integrity: 'OK' | 'INCONSISTÊNCIA'
    sticks: ReconciliationResult | null
    medications: Array<{ id: string; name: string; reconciliation: ReconciliationResult }>
  }> {
    const sticksEntity = await this.db.stockEntities.get(STICKS_ENTITY_ID)
    const sticks = sticksEntity ? await this.reconcile(STICKS_ENTITY_ID) : null
    const medications = await this.db.stockEntities.where('kind').equals('medication').toArray()
    const medicationResults = await Promise.all(
      medications.map(async (medication) => ({
        id: medication.id,
        name: medication.name,
        reconciliation: await this.reconcile(medication.id),
      })),
    )
    const ok = (sticks?.ok ?? true) && medicationResults.every((item) => item.reconciliation.ok)
    return { integrity: ok ? 'OK' : 'INCONSISTÊNCIA', sticks, medications: medicationResults }
  }

  formatMovementQuantity(movement: StockMovement, entity: StockEntity): string {
    return minorToDecimal(movement.quantityMinor, movementScale(entity))
  }
}
