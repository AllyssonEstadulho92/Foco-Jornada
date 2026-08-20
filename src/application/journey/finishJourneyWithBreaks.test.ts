import { describe, expect, it } from 'vitest'
import { startBreak } from '../breaks/startBreak'
import { InMemoryBreakRepository } from '../../test/InMemoryBreakRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { finishJourneyWithBreaks } from './finishJourneyWithBreaks'
import { startJourney } from './startJourney'

describe('finishJourneyWithBreaks', () => {
  it('encerra uma pausa ativa antes de terminar a jornada', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const breakRepository = new InMemoryBreakRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    await startBreak({
      journeyRepository,
      breakRepository,
      type: 'short',
      plannedDurationMinutes: 15,
      now: () => new Date('2026-08-20T11:00:00.000Z'),
      createId: () => 'break-1',
    })

    const result = await finishJourneyWithBreaks({
      journeyRepository,
      breakRepository,
      journeyId: 'journey-1',
      now: () => new Date('2026-08-20T11:10:00.000Z'),
    })

    expect(result.status).toBe('finished')
    expect(await breakRepository.getActiveForJourney('journey-1')).toBeUndefined()
    expect(breakRepository.snapshot()[0]?.actualDurationSeconds).toBe(600)
    expect(await journeyRepository.getActive()).toBeUndefined()
  })
})
