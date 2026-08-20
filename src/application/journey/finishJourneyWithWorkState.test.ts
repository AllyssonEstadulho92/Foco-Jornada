import { describe, expect, it } from 'vitest'
import { createActivity } from '../activities/createActivity'
import { startActivity } from '../activities/startActivity'
import { startBreak } from '../breaks/startBreak'
import { InMemoryActivityRepository } from '../../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../../test/InMemoryBreakRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { finishJourneyWithWorkState } from './finishJourneyWithWorkState'
import { startJourney } from './startJourney'

describe('finishJourneyWithWorkState', () => {
  it('encerra atividade e pausa ativas antes da jornada', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const breakRepository = new InMemoryBreakRepository()
    const activityRepository = new InMemoryActivityRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    await createActivity({
      journeyRepository,
      activityRepository,
      name: 'Atendimento',
      now: () => new Date('2026-08-20T08:05:00.000Z'),
      createId: () => 'activity-1',
    })
    await startActivity({
      journeyRepository,
      activityRepository,
      activityId: 'activity-1',
      now: () => new Date('2026-08-20T09:00:00.000Z'),
    })
    await startBreak({
      journeyRepository,
      breakRepository,
      type: 'short',
      plannedDurationMinutes: 15,
      now: () => new Date('2026-08-20T11:00:00.000Z'),
      createId: () => 'break-1',
    })

    const result = await finishJourneyWithWorkState({
      journeyRepository,
      breakRepository,
      activityRepository,
      journeyId: 'journey-1',
      now: () => new Date('2026-08-20T11:10:00.000Z'),
    })

    expect(result.status).toBe('finished')
    expect(await journeyRepository.getActive()).toBeUndefined()
    expect(await breakRepository.getActiveForJourney('journey-1')).toBeUndefined()
    expect(await activityRepository.getActiveForJourney('journey-1')).toBeUndefined()
    expect((await activityRepository.getById('activity-1'))?.status).toBe('completed')
  })
})
