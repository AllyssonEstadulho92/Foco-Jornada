import { describe, expect, it } from 'vitest'
import type { MedicationDoseEvent } from '../../domain/personalStock/models'
import {
  calculateMedicationNextDoseCountdown,
  formatMedicationCountdown,
  resolveLastActiveTakenEvent,
} from './MedicationNextDoseTimer'

function event(overrides: Partial<MedicationDoseEvent> & Pick<MedicationDoseEvent, 'id' | 'status' | 'createdAt'>): MedicationDoseEvent {
  return {
    operationId: overrides.id,
    occurrenceKey: `occurrence:${overrides.id}`,
    medicationId: 'med-1',
    scheduleId: 'schedule-1',
    scheduledAt: overrides.createdAt,
    quantityMinor: '1',
    ...overrides,
  }
}

describe('MedicationNextDoseTimer', () => {
  it('calcula a contagem exata a partir do timestamp da próxima toma', () => {
    const result = calculateMedicationNextDoseCountdown(
      '2026-08-29T16:15:00.000Z',
      new Date('2026-08-29T12:32:45.000Z'),
      '2026-08-29T08:15:00.000Z',
    )

    expect(result?.remainingSeconds).toBe(13_335)
    expect(formatMedicationCountdown(result?.remainingSeconds ?? 0)).toBe('03:42:15')
    expect(result?.due).toBe(false)
  })

  it('reconstrói o progresso entre a última confirmação e a próxima toma', () => {
    const result = calculateMedicationNextDoseCountdown(
      '2026-08-29T16:00:00.000Z',
      new Date('2026-08-29T12:00:00.000Z'),
      '2026-08-29T08:00:00.000Z',
    )

    expect(result?.progressPercent).toBe(50)
  })

  it('não gera valores negativos quando a hora programada já foi atingida', () => {
    const result = calculateMedicationNextDoseCountdown(
      '2026-08-29T12:00:00.000Z',
      new Date('2026-08-29T12:00:01.000Z'),
    )

    expect(result?.remainingSeconds).toBe(0)
    expect(result?.due).toBe(true)
  })

  it('não inventa uma contagem quando o timestamp é inválido', () => {
    expect(calculateMedicationNextDoseCountdown('inválido', new Date())).toBeNull()
    expect(calculateMedicationNextDoseCountdown(null, new Date())).toBeNull()
  })

  it('ignora uma toma que foi posteriormente corrigida', () => {
    const taken = event({ id: 'taken-1', status: 'taken', createdAt: '2026-08-29T08:00:00.000Z' })
    const corrected = event({
      id: 'correction-1',
      status: 'corrected',
      createdAt: '2026-08-29T08:01:00.000Z',
      correctionOf: taken.id,
    })
    const olderTaken = event({ id: 'taken-0', status: 'taken', createdAt: '2026-08-28T20:00:00.000Z' })

    expect(resolveLastActiveTakenEvent([olderTaken, taken, corrected])?.id).toBe(olderTaken.id)
  })
})
