import { describe, expect, it } from 'vitest'
import { createBreakRecord, finishBreakRecord, getBreakDurationMs } from './BreakRecord'

describe('BreakRecord', () => {
  it('cria uma pausa ativa com duração prevista', () => {
    const record = createBreakRecord({
      id: 'break-1',
      journeyId: 'journey-1',
      type: 'short',
      plannedDurationMinutes: 15,
      now: '2026-08-20T10:00:00.000Z',
    })

    expect(record.status).toBe('active')
    expect(record.plannedDurationMinutes).toBe(15)
  })

  it('rejeita duração prevista inválida', () => {
    expect(() =>
      createBreakRecord({
        id: 'break-1',
        journeyId: 'journey-1',
        type: 'custom',
        plannedDurationMinutes: 0,
        now: '2026-08-20T10:00:00.000Z',
      }),
    ).toThrow('superior a zero')
  })

  it('guarda a duração real quando termina', () => {
    const active = createBreakRecord({
      id: 'break-1',
      journeyId: 'journey-1',
      type: 'short',
      plannedDurationMinutes: 15,
      now: '2026-08-20T10:00:00.000Z',
    })

    const finished = finishBreakRecord(active, '2026-08-20T10:12:30.000Z')

    expect(finished.status).toBe('finished')
    expect(finished.actualDurationSeconds).toBe(750)
    expect(getBreakDurationMs(finished)).toBe(750_000)
  })
})
