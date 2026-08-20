import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createActivity, startActivityRecord } from '../../domain/activities/Activity'
import { AppDatabase } from '../database/appDatabase'
import { DexieActivityRepository } from './DexieActivityRepository'

describe('DexieActivityRepository', () => {
  let database: AppDatabase
  let repository: DexieActivityRepository

  beforeEach(() => {
    database = new AppDatabase(`foco-jornada-activity-test-${crypto.randomUUID()}`)
    repository = new DexieActivityRepository(database)
  })

  afterEach(async () => {
    database.close()
    await database.delete()
  })

  it('persiste e lista atividades da jornada', async () => {
    const activity = createActivity({
      id: 'activity-1',
      journeyId: 'journey-1',
      name: 'Atendimento',
      now: '2026-08-20T08:00:00.000Z',
    })

    await repository.create(activity)

    expect(await repository.getById('activity-1')).toEqual(activity)
    expect(await repository.listByJourney('journey-1')).toEqual([activity])
  })

  it('impede duas atividades ativas concorrentes', async () => {
    const first = createActivity({
      id: 'activity-1',
      journeyId: 'journey-1',
      name: 'A',
      now: '2026-08-20T08:00:00.000Z',
    })
    const second = createActivity({
      id: 'activity-2',
      journeyId: 'journey-1',
      name: 'B',
      now: '2026-08-20T08:01:00.000Z',
    })

    await repository.create(first)
    await repository.create(second)

    const results = await Promise.all([
      repository.startIfNoActive(startActivityRecord(first, '2026-08-20T09:00:00.000Z')),
      repository.startIfNoActive(startActivityRecord(second, '2026-08-20T09:00:00.000Z')),
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await database.activities.where('status').equals('active').count()).toBe(1)
  })
})
