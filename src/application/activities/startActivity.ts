import { startActivityRecord, type Activity } from '../../domain/activities/Activity'
import type { JourneyRepository } from '../journey/JourneyRepository'
import type { ActivityRepository } from './ActivityRepository'

export type StartActivityResult =
  | { status: 'started'; activity: Activity }
  | { status: 'no-active-journey' }
  | { status: 'not-found' }
  | { status: 'different-journey'; activity: Activity }
  | { status: 'not-pending'; activity: Activity }
  | { status: 'another-active'; activity: Activity }

export interface StartActivityDependencies {
  journeyRepository: JourneyRepository
  activityRepository: ActivityRepository
  activityId: string
  now?: () => Date
}

export async function startActivity({
  journeyRepository,
  activityRepository,
  activityId,
  now = () => new Date(),
}: StartActivityDependencies): Promise<StartActivityResult> {
  const activeJourney = await journeyRepository.getActive()
  if (!activeJourney) return { status: 'no-active-journey' }

  const current = await activityRepository.getById(activityId)
  if (!current) return { status: 'not-found' }
  if (current.journeyId !== activeJourney.id) return { status: 'different-journey', activity: current }
  if (current.status !== 'pending') return { status: 'not-pending', activity: current }

  const existing = await activityRepository.getActiveForJourney(activeJourney.id)
  if (existing) return { status: 'another-active', activity: existing }

  const started = startActivityRecord(current, now().toISOString())
  const persisted = await activityRepository.startIfNoActive(started)

  if (!persisted) {
    const concurrent = await activityRepository.getActiveForJourney(activeJourney.id)
    if (concurrent) return { status: 'another-active', activity: concurrent }
    return { status: 'not-pending', activity: current }
  }

  return { status: 'started', activity: started }
}
