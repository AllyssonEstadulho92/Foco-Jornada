import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_SETTINGS } from '../../domain/settings/AppSettings'
import { InMemoryActivityRepository } from '../../test/InMemoryActivityRepository'
import { InMemoryBreakRepository } from '../../test/InMemoryBreakRepository'
import { InMemoryFocusRepository } from '../../test/InMemoryFocusRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { InMemorySettingsRepository } from '../../test/InMemorySettingsRepository'
import { finishJourneyWithProductivityState } from './finishJourneyWithProductivityState'
import { startJourney } from './startJourney'
import { reconcileScheduledWorkday } from './reconcileScheduledWorkday'

function at(hour: number, minute = 0) {
  return new Date(2026, 8, 10, hour, minute, 0, 0)
}

function createDependencies() {
  const journeyRepository = new InMemoryJourneyRepository()
  const breakRepository = new InMemoryBreakRepository()
  const activityRepository = new InMemoryActivityRepository()
  const focusRepository = new InMemoryFocusRepository()
  const settingsRepository = new InMemorySettingsRepository({
    ...DEFAULT_APP_SETTINGS,
    workSchedule: {
      ...DEFAULT_APP_SETTINGS.workSchedule,
      startTime: '08:00',
      endTime: '17:00',
      break1: { enabled: true, startTime: '14:00', endTime: '15:00' },
      break2: { enabled: false, startTime: '15:00', endTime: '15:15' },
    },
  })

  return {
    journeyRepository,
    breakRepository,
    activityRepository,
    focusRepository,
    settingsRepository,
  }
}

describe('reconcileScheduledWorkday', () => {
  it('não inicia antes da entrada planeada', async () => {
    const dependencies = createDependencies()
    const actions = await reconcileScheduledWorkday({ ...dependencies, now: () => at(7, 59) })

    expect(actions).toEqual([])
    expect(dependencies.journeyRepository.snapshot()).toHaveLength(0)
  })

  it('inicia a jornada no timestamp exato da entrada configurada', async () => {
    const dependencies = createDependencies()
    const actions = await reconcileScheduledWorkday({ ...dependencies, now: () => at(8, 0) })

    expect(actions).toEqual(['journey-started'])
    expect(dependencies.journeyRepository.snapshot()[0]).toMatchObject({
      id: 'scheduled-journey-2026-09-10',
      date: '2026-09-10',
      startedAt: at(8, 0).toISOString(),
      status: 'active',
    })
  })

  it('reconstrói a pausa configurada com início e fim exatos quando a aplicação regressa depois da pausa', async () => {
    const dependencies = createDependencies()

    const actions = await reconcileScheduledWorkday({ ...dependencies, now: () => at(16, 0) })

    expect(actions).toEqual(['journey-started', 'break-started', 'break-finished'])
    expect(dependencies.breakRepository.snapshot()[0]).toMatchObject({
      id: 'scheduled-2026-09-10-break-1',
      plannedDurationMinutes: 60,
      startedAt: at(14, 0).toISOString(),
      endedAt: at(15, 0).toISOString(),
      actualDurationSeconds: 3600,
      status: 'finished',
    })
  })

  it('termina a jornada ativa exatamente à saída configurada', async () => {
    const dependencies = createDependencies()
    await reconcileScheduledWorkday({ ...dependencies, now: () => at(8, 0) })

    const actions = await reconcileScheduledWorkday({ ...dependencies, now: () => at(17, 5) })
    const journey = dependencies.journeyRepository.snapshot()[0]

    expect(actions).toContain('journey-finished')
    expect(journey).toMatchObject({
      endedAt: at(17, 0).toISOString(),
      status: 'finished',
    })
  })

  it('não fabrica uma jornada completa quando a aplicação só abre depois da saída', async () => {
    const dependencies = createDependencies()
    const actions = await reconcileScheduledWorkday({ ...dependencies, now: () => at(18, 0) })

    expect(actions).toEqual([])
    expect(dependencies.journeyRepository.snapshot()).toHaveLength(0)
  })

  it('não reinicia uma jornada que o utilizador terminou manualmente antes da saída', async () => {
    const dependencies = createDependencies()
    const started = await startJourney({
      repository: dependencies.journeyRepository,
      now: () => at(8, 0),
      createId: () => 'manual-journey',
    })

    await finishJourneyWithProductivityState({
      journeyRepository: dependencies.journeyRepository,
      breakRepository: dependencies.breakRepository,
      activityRepository: dependencies.activityRepository,
      focusRepository: dependencies.focusRepository,
      journeyId: started.journey.id,
      now: () => at(12, 0),
    })

    const actions = await reconcileScheduledWorkday({ ...dependencies, now: () => at(13, 0) })

    expect(actions).toEqual([])
    expect(dependencies.journeyRepository.snapshot()).toHaveLength(1)
    expect(dependencies.journeyRepository.snapshot()[0].status).toBe('finished')
  })
})
