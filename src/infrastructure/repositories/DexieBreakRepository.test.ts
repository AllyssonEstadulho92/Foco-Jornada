import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createBreakRecord, finishBreakRecord } from '../../domain/breaks/BreakRecord'
import { AppDatabase } from '../database/appDatabase'
import { DexieBreakRepository } from './DexieBreakRepository'

describe('DexieBreakRepository', () => {
  let database: AppDatabase
  let repository: DexieBreakRepository

  beforeEach(() => {
    database = new AppDatabase(`foco-jornada-break-test-${crypto.randomUUID()}`)
    repository = new DexieBreakRepository(database)
  })

  afterEach(async () => {
    database.close()
    await database.delete()
  })

  it('persiste e recupera uma pausa ativa', async () => {
    const record = createBreakRecord({
      id: 'break-1',
      journeyId: 'journey-1',
      type: 'short',
      plannedDurationMinutes: 15,
      now: '2026-08-20T10:00:00.000Z',
    })

    expect(await repository.createIfNoActive(record)).toBe(true)
    expect(await repository.getActiveForJourney('journey-1')).toEqual(record)
  })

  it('impede duas pausas ativas concorrentes na mesma jornada', async () => {
    const first = createBreakRecord({
      id: 'break-1',
      journeyId: 'journey-1',
      type: 'short',
      plannedDurationMinutes: 15,
      now: '2026-08-20T10:00:00.000Z',
    })
    const second = createBreakRecord({
      id: 'break-2',
      journeyId: 'journey-1',
      type: 'long',
      plannedDurationMinutes: 60,
      now: '2026-08-20T10:00:01.000Z',
    })

    const results = await Promise.all([
      repository.createIfNoActive(first),
      repository.createIfNoActive(second),
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
    const records = await repository.listByJourney('journey-1')
    expect(records.filter((record) => record.status === 'active')).toHaveLength(1)
  })

  it('protege contra terminar duas vezes a mesma pausa', async () => {
    const active = createBreakRecord({
      id: 'break-1',
      journeyId: 'journey-1',
      type: 'short',
      plannedDurationMinutes: 15,
      now: '2026-08-20T10:00:00.000Z',
    })
    await repository.createIfNoActive(active)

    const finished = finishBreakRecord(active, '2026-08-20T10:15:00.000Z')

    expect(await repository.finishIfActive(finished)).toBe(true)
    expect(await repository.finishIfActive(finished)).toBe(false)
  })
})
