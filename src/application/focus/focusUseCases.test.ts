import { describe, expect, it } from 'vitest'
import { InMemoryActivityRepository } from '../../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../../test/InMemoryBreakRepository'
import { InMemoryFocusRepository } from '../../test/InMemoryFocusRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { startJourney } from '../journey/startJourney'
import { pauseFocusSession } from './pauseFocusSession'
import { resumeFocusSession } from './resumeFocusSession'
import { startFocusSession } from './startFocusSession'

describe('casos de uso de Foco', () => {
  it('exige jornada ativa e impede duas sessões abertas', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const breakRepository = new InMemoryBreakRepository()
    const activityRepository = new InMemoryActivityRepository()
    const focusRepository = new InMemoryFocusRepository()

    const noJourney = await startFocusSession({
      journeyRepository,
      breakRepository,
      activityRepository,
      focusRepository,
      mode: 'custom',
      plannedDurationSeconds: 600,
      createId: () => 'focus-0',
    })
    expect(noJourney.status).toBe('no-active-journey')

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })

    const first = await startFocusSession({
      journeyRepository,
      breakRepository,
      activityRepository,
      focusRepository,
      mode: 'custom',
      plannedDurationSeconds: 600,
      now: () => new Date('2026-08-20T08:01:00.000Z'),
      createId: () => 'focus-1',
    })
    const second = await startFocusSession({
      journeyRepository,
      breakRepository,
      activityRepository,
      focusRepository,
      mode: 'custom',
      plannedDurationSeconds: 300,
      createId: () => 'focus-2',
    })

    expect(first.status).toBe('started')
    expect(second.status).toBe('already-open')
    expect(focusRepository.snapshot()).toHaveLength(1)
  })

  it('persiste os estados pausado e retomado', async () => {
    const journeyRepository = new InMemoryJourneyRepository()
    const breakRepository = new InMemoryBreakRepository()
    const activityRepository = new InMemoryActivityRepository()
    const focusRepository = new InMemoryFocusRepository()

    await startJourney({
      repository: journeyRepository,
      now: () => new Date('2026-08-20T08:00:00.000Z'),
      createId: () => 'journey-1',
    })
    await startFocusSession({
      journeyRepository,
      breakRepository,
      activityRepository,
      focusRepository,
      mode: 'pomodoro',
      now: () => new Date('2026-08-20T08:05:00.000Z'),
      createId: () => 'focus-1',
    })

    const paused = await pauseFocusSession({
      focusRepository,
      journeyId: 'journey-1',
      now: () => new Date('2026-08-20T08:10:00.000Z'),
    })
    const resumed = await resumeFocusSession({
      focusRepository,
      journeyId: 'journey-1',
      now: () => new Date('2026-08-20T08:12:00.000Z'),
    })

    expect(paused.status).toBe('paused')
    expect(resumed.status).toBe('resumed')
    expect((await focusRepository.getOpenForJourney('journey-1'))?.status).toBe('running')
  })
})
