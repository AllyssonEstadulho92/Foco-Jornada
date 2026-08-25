import type {
  PhysicalStockCheck,
  StockEntity,
  StockMovement,
} from '../../domain/personalStock/models'
import type { AppDatabase } from '../../infrastructure/database/appDatabase'
import { minorToDecimal, parseDecimalToMinor } from './decimal'
import { STICKS_ENTITY_ID } from './PersonalStockService'

function newId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
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

function renderMinor(entity: StockEntity, value: bigint): string {
  return entity.kind === 'sticks' ? value.toString() : minorToDecimal(value)
}

function parsePhysicalCount(entity: StockEntity, raw: string): bigint {
  const value = raw.trim()
  if (!value) throw new Error('Indica a quantidade contada fisicamente.')

  if (entity.kind === 'sticks') {
    if (!/^\d+$/.test(value)) throw new Error('A contagem de sticks deve ser um número inteiro não negativo.')
    const parsed = BigInt(value)
    if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('A contagem excede o limite seguro suportado.')
    return parsed
  }

  const parsed = parseDecimalToMinor(value)
  if (parsed < 0n) throw new Error('A contagem física não pode ser negativa.')
  return parsed
}

export class StockReconciliationService {
  constructor(private readonly db: AppDatabase) {}

  private async movementsFor(entityId: string): Promise<StockMovement[]> {
    const movements = await this.db.stockMovements.where('entityId').equals(entityId).toArray()
    return movements.sort(compareMovements)
  }

  private async appendCorrection(
    entity: StockEntity,
    operationId: string,
    quantity: bigint,
    options: { correctionOf?: string; correctionReason: 'physical_count' | 'undo_restock' },
  ): Promise<StockMovement | null> {
    if (quantity === 0n) return null

    const duplicate = await this.db.stockMovements.where('operationId').equals(operationId).first()
    if (duplicate) {
      if (
        duplicate.entityId !== entity.id
        || duplicate.type !== 'correction'
        || BigInt(duplicate.quantityMinor) !== quantity
        || duplicate.correctionOf !== options.correctionOf
        || duplicate.correctionReason !== options.correctionReason
      ) {
        throw new Error('operationId já existe com um conteúdo diferente.')
      }
      return duplicate
    }

    const movements = await this.movementsFor(entity.id)
    const before = reconstruct(movements)
    const after = before + quantity
    if (after < 0n) throw new Error('Stock insuficiente para aplicar esta correção.')
    if (entity.kind === 'sticks' && after > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('Stock de sticks excede o limite seguro suportado.')
    }

    const now = new Date().toISOString()
    const movement: StockMovement = {
      id: newId(),
      operationId,
      entityId: entity.id,
      type: 'correction',
      quantityMinor: quantity.toString(),
      balanceBeforeMinor: before.toString(),
      balanceAfterMinor: after.toString(),
      sequence: movements.length,
      effectiveAt: now,
      createdAt: now,
      correctionOf: options.correctionOf,
      correctionReason: options.correctionReason,
    }
    await this.db.stockMovements.add(movement)

    const verified = reconstruct(await this.movementsFor(entity.id))
    if (verified !== after) throw new Error('INCONSISTÊNCIA: o ledger não reconstrói o saldo corrigido.')
    return movement
  }

  async getPhysicalCheck(entityId: string): Promise<PhysicalStockCheck | null> {
    const entity = await this.db.stockEntities.get(entityId)
    if (!entity || !entity.lastPhysicalCountAt) return null
    if (
      entity.lastPhysicalCountMinor === undefined
      || entity.lastPhysicalExpectedMinor === undefined
      || entity.lastPhysicalAdjustmentMinor === undefined
    ) return null

    return {
      entityId,
      checkedAt: entity.lastPhysicalCountAt,
      expected: renderMinor(entity, BigInt(entity.lastPhysicalExpectedMinor)),
      counted: renderMinor(entity, BigInt(entity.lastPhysicalCountMinor)),
      adjustment: renderMinor(entity, BigInt(entity.lastPhysicalAdjustmentMinor)),
    }
  }

  async reconcilePhysicalCount(
    entityId: string,
    rawCount: string,
    operationId: string,
  ): Promise<PhysicalStockCheck> {
    let result: PhysicalStockCheck | null = null

    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      const entity = await this.db.stockEntities.get(entityId)
      if (!entity) throw new Error('Stock não encontrado.')

      const movements = await this.movementsFor(entityId)
      if (!movements.length) throw new Error('Define primeiro o stock inicial.')
      const expected = reconstruct(movements)
      const counted = parsePhysicalCount(entity, rawCount)
      const adjustment = counted - expected

      if (adjustment !== 0n) {
        await this.appendCorrection(entity, operationId, adjustment, { correctionReason: 'physical_count' })
      }

      const checkedAt = new Date().toISOString()
      await this.db.stockEntities.update(entity.id, {
        lastPhysicalCountMinor: counted.toString(),
        lastPhysicalExpectedMinor: expected.toString(),
        lastPhysicalAdjustmentMinor: adjustment.toString(),
        lastPhysicalCountAt: checkedAt,
      })

      result = {
        entityId,
        checkedAt,
        expected: renderMinor(entity, expected),
        counted: renderMinor(entity, counted),
        adjustment: renderMinor(entity, adjustment),
      }
    })

    if (!result) throw new Error('Não foi possível guardar a contagem física.')
    return result
  }

  async reconcileSticksPhysicalCount(rawCount: string, operationId: string): Promise<PhysicalStockCheck> {
    return this.reconcilePhysicalCount(STICKS_ENTITY_ID, rawCount, operationId)
  }

  async reconcileMedicationPhysicalCount(
    medicationId: string,
    rawCount: string,
    operationId: string,
  ): Promise<PhysicalStockCheck> {
    const entity = await this.db.stockEntities.get(medicationId)
    if (!entity || entity.kind !== 'medication') throw new Error('Medicamento não encontrado.')
    return this.reconcilePhysicalCount(medicationId, rawCount, operationId)
  }

  async undoLastRestock(entityId: string, operationId: string): Promise<void> {
    await this.db.transaction('rw', this.db.stockEntities, this.db.stockMovements, async () => {
      const entity = await this.db.stockEntities.get(entityId)
      if (!entity) throw new Error('Stock não encontrado.')

      const duplicate = await this.db.stockMovements.where('operationId').equals(operationId).first()
      if (duplicate) {
        if (duplicate.entityId !== entityId || duplicate.type !== 'correction' || duplicate.correctionReason !== 'undo_restock') {
          throw new Error('operationId já existe com um conteúdo diferente.')
        }
        return
      }

      const movements = await this.movementsFor(entityId)
      const current = reconstruct(movements)
      const corrections = new Map<string, bigint>()
      for (const movement of movements) {
        if (!movement.correctionOf) continue
        corrections.set(
          movement.correctionOf,
          (corrections.get(movement.correctionOf) ?? 0n) + BigInt(movement.quantityMinor),
        )
      }

      const target = [...movements].reverse().find((movement) => {
        if (movement.type !== 'restock') return false
        return BigInt(movement.quantityMinor) + (corrections.get(movement.id) ?? 0n) > 0n
      })
      if (!target) throw new Error('Não existe uma reposição por corrigir.')

      const outstanding = BigInt(target.quantityMinor) + (corrections.get(target.id) ?? 0n)
      if (current < outstanding) {
        throw new Error('Não é possível anular esta reposição por completo porque parte do stock já foi consumida. Usa a contagem física para reconciliar.')
      }

      await this.appendCorrection(entity, operationId, -outstanding, {
        correctionOf: target.id,
        correctionReason: 'undo_restock',
      })
    })
  }

  async undoLastStickRestock(operationId: string): Promise<void> {
    return this.undoLastRestock(STICKS_ENTITY_ID, operationId)
  }

  async undoLastMedicationRestock(medicationId: string, operationId: string): Promise<void> {
    const entity = await this.db.stockEntities.get(medicationId)
    if (!entity || entity.kind !== 'medication') throw new Error('Medicamento não encontrado.')
    return this.undoLastRestock(medicationId, operationId)
  }
}
