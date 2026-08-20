import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createJourney } from '../../domain/journey/Journey'
import { AppDatabase } from '../database/appDatabase'
import { DexieJourneyRepository } from './DexieJourneyRepository'

describe('DexieJourneyRepository', () => {
  let database: AppDatabase
  let repository: DexieJourneyRepository

  beforeEach(() => {
    database = new AppDatabase(`foco-jornada-test-${crypto.randomUUID()}`)
    repository = new DexieJourneyRepository(database)
  })

  afterEach(async () => {
    database.close()
    await database.delete()
  })

  it('persiste e recupera uma jornada ativa', async () => {
    const journey = createJourney({
      id: 'journey-1',
      date: '2026-08-20',
      now: '2026-08-20T08:00:00.000Z',
    })

    expect(await repository.createIfNoActive(journey)).toBe(true)
    expect(await repository.getActive()).toEqual(journey)
  })

  it('impede duas criações concorrentes de jornadas ativas', async () => {
    const first = createJourney({
      id: 'journey-1',
      date: '2026-08-20',
      now: '2026-08-20T08:00:00.000Z',
    })
    const second = createJourney({
      id: 'journey-2',
      date: '2026-08-20',
      now: '2026-08-20T08:00:01.000Z',
    })

    const results = await Promise.all([
      repository.createIfNoActive(first),
      repository.createIfNoActive(second),
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await database.journeys.where('status').equals('active').count()).toBe(1)
  })
})
