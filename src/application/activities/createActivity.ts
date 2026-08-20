import { createActivity as createActivityEntity, type Activity } from '../../domain/activities/Activity'
import type { JourneyRepository } from '../journey/JourneyRepository'
import type { ActivityRepository } from './ActivityRepository'

export type CreateActivityResult =
  | { status: 'created'; activity: Activity }
  | { status: 'no-active-journey' }

export interface CreateActivityDependencies {
  journeyRepository: JourneyRepository
  activityRepository: ActivityRepository
  name: string
  description?: string
  now?: () => Date
  createId?: () => string
}

export async function createActivity({
  journeyRepository,
  activityRepository,
  name,
  description,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}: CreateActivityDependencies): Promise<CreateActivityResult> {
  const activeJourney = await journeyRepository.getActive()
  if (!activeJourney) return { status: 'no-active-journey' }

  const activity = createActivityEntity({
    id: createId(),
    journeyId: activeJourney.id,
    name,
    description,
    now: now().toISOString(),
  })

  await activityRepository.create(activity)
  return { status: 'created', activity }
}
