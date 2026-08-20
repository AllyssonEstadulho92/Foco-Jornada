import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFocusSession } from '../../domain/focus/FocusSession'
import { AppDatabase } from '../database/appDatabase'
import { DexieFocusRepository } from './DexieFocusRepository'

describe('DexieFocusRepository', () => {
  let database: AppDatabase
  let repository: DexieFocusRepository

  beforeEach(() => {
    database = new AppDatabase(`foco-jornada-focus-${crypto.randomUUID()}`)
    repository = new DexieFocusRepository(database)
  })

  afterEach(async () => {
    database.close()
    await database.delete()
  })

  it('persiste e recupera uma sessão aberta', async () => {
    const session = createFocusSession({
      id: 'focus-1',
      journeyId: 'journey-1',
      mode: 'custom',
      segmentType: 'focus',
      plannedDurationSeconds: 600,
      cycle: 1,
      now: '2026-08-20T08:00:00.000Z',
    })

    expect(await repository.createIfNoOpen(session)).toBe(true)
    expect(await repository.getOpenForJourney('journey-1')).toEqual(session)
  })

  it('impede duas sessões abertas concorrentes na mesma jornada', async () => {
    const makeSession = (id: string) =>
      createFocusSession({
        id,
        journeyId: 'journey-1',
        mode: 'custom',
        segmentType: 'focus',
        plannedDurationSeconds: 600,
        cycle: 1,
        now: '2026-08-20T08:00:00.000Z',
      })

    const results = await Promise.all([
      repository.createIfNoOpen(makeSession('focus-1')),
      repository.createIfNoOpen(makeSession('focus-2')),
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await database.focusSessions.count()).toBe(1)
  })
})
