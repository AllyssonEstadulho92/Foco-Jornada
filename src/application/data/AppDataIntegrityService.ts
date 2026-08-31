import type { AppDatabase } from '../../infrastructure/database/appDatabase'

export interface DataIntegrityIssue {
  code: string
  detail: string
}

export interface DataIntegrityReport {
  ok: boolean
  checkedAt: string
  issues: DataIntegrityIssue[]
  counts: {
    journeys: number
    breaks: number
    activities: number
    focusSessions: number
    coffeeRecords: number
    stockEntities: number
    stockMovements: number
    medicationSchedules: number
    medicationDoseEvents: number
  }
}

function issue(code: string, detail: string): DataIntegrityIssue {
  return { code, detail }
}

export class AppDataIntegrityService {
  constructor(private readonly db: AppDatabase) {}

  async audit(): Promise<DataIntegrityReport> {
    const [
      journeys,
      breaks,
      activities,
      focusSessions,
      coffeeRecords,
      stockEntities,
      stockMovements,
      medicationSchedules,
      medicationDoseEvents,
    ] = await Promise.all([
      this.db.journeys.toArray(),
      this.db.breaks.toArray(),
      this.db.activities.toArray(),
      this.db.focusSessions.toArray(),
      this.db.coffeeRecords.toArray(),
      this.db.stockEntities.toArray(),
      this.db.stockMovements.toArray(),
      this.db.medicationSchedules.toArray(),
      this.db.medicationDoseEvents.toArray(),
    ])

    const issues: DataIntegrityIssue[] = []
    const journeyIds = new Set(journeys.map((item) => item.id))
    const entityById = new Map(stockEntities.map((item) => [item.id, item]))
    const scheduleById = new Map(medicationSchedules.map((item) => [item.id, item]))
    const movementById = new Map(stockMovements.map((item) => [item.id, item]))

    const activeJourneys = journeys.filter((item) => item.status === 'active')
    if (activeJourneys.length > 1) {
      issues.push(issue('journey.multiple-active', `Existem ${activeJourneys.length} jornadas ativas.`))
    }

    for (const record of breaks) {
      if (!journeyIds.has(record.journeyId)) {
        issues.push(issue('break.orphan', `A pausa ${record.id} refere uma jornada inexistente.`))
      }
    }

    const activeBreaksByJourney = new Map<string, number>()
    for (const record of breaks.filter((item) => item.status === 'active')) {
      activeBreaksByJourney.set(record.journeyId, (activeBreaksByJourney.get(record.journeyId) ?? 0) + 1)
    }
    for (const [journeyId, count] of activeBreaksByJourney) {
      if (count > 1) issues.push(issue('break.multiple-active', `A jornada ${journeyId} tem ${count} pausas ativas.`))
    }

    for (const record of activities) {
      if (!journeyIds.has(record.journeyId)) {
        issues.push(issue('activity.orphan', `A atividade ${record.id} refere uma jornada inexistente.`))
      }
    }

    const openFocusByJourney = new Map<string, number>()
    for (const session of focusSessions) {
      if (!journeyIds.has(session.journeyId)) {
        issues.push(issue('focus.orphan', `A sessão de foco ${session.id} refere uma jornada inexistente.`))
      }
      if (session.status === 'running' || session.status === 'paused') {
        openFocusByJourney.set(session.journeyId, (openFocusByJourney.get(session.journeyId) ?? 0) + 1)
      }
    }
    for (const [journeyId, count] of openFocusByJourney) {
      if (count > 1) issues.push(issue('focus.multiple-open', `A jornada ${journeyId} tem ${count} sessões de foco abertas.`))
    }

    for (const record of coffeeRecords) {
      if (record.journeyId && !journeyIds.has(record.journeyId)) {
        issues.push(issue('coffee.orphan', `O registo de café ${record.id} refere uma jornada inexistente.`))
      }
    }

    const movementsByEntity = new Map<string, typeof stockMovements>()
    for (const movement of stockMovements) {
      if (!entityById.has(movement.entityId)) {
        issues.push(issue('stock.orphan-movement', `O movimento ${movement.id} refere uma entidade inexistente.`))
      }
      const group = movementsByEntity.get(movement.entityId) ?? []
      group.push(movement)
      movementsByEntity.set(movement.entityId, group)
    }

    for (const [entityId, group] of movementsByEntity) {
      const ordered = [...group].sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
      let balance = 0n
      for (let index = 0; index < ordered.length; index += 1) {
        const movement = ordered[index]
        try {
          const before = BigInt(movement.balanceBeforeMinor)
          const quantity = BigInt(movement.quantityMinor)
          const after = BigInt(movement.balanceAfterMinor)
          if (movement.sequence !== index || before !== balance || before + quantity !== after || after < 0n) {
            issues.push(issue('stock.ledger', `O ledger de ${entityId} é incoerente no movimento ${movement.id}.`))
            break
          }
          balance = after
        } catch {
          issues.push(issue('stock.invalid-number', `O movimento ${movement.id} contém valores numéricos inválidos.`))
          break
        }
      }
    }

    for (const schedule of medicationSchedules) {
      const medication = entityById.get(schedule.medicationId)
      if (!medication || medication.kind !== 'medication') {
        issues.push(issue('medication.orphan-schedule', `O horário ${schedule.id} refere um medicamento inexistente.`))
      }
    }

    for (const event of medicationDoseEvents) {
      const medication = entityById.get(event.medicationId)
      const schedule = scheduleById.get(event.scheduleId)
      if (!medication || medication.kind !== 'medication' || !schedule || schedule.medicationId !== event.medicationId) {
        issues.push(issue('medication.orphan-event', `O evento de toma ${event.id} tem referências incoerentes.`))
        continue
      }
      if (event.status === 'taken') {
        const movement = event.stockMovementId ? movementById.get(event.stockMovementId) : undefined
        if (!movement || movement.entityId !== event.medicationId || movement.type !== 'consumption') {
          issues.push(issue('medication.missing-consumption', `A toma ${event.id} não tem um consumo de stock válido associado.`))
        }
      }
    }

    return {
      ok: issues.length === 0,
      checkedAt: new Date().toISOString(),
      issues,
      counts: {
        journeys: journeys.length,
        breaks: breaks.length,
        activities: activities.length,
        focusSessions: focusSessions.length,
        coffeeRecords: coffeeRecords.length,
        stockEntities: stockEntities.length,
        stockMovements: stockMovements.length,
        medicationSchedules: medicationSchedules.length,
        medicationDoseEvents: medicationDoseEvents.length,
      },
    }
  }
}
