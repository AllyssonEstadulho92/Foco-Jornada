import { completeActivityRecord, type Activity } from '../../domain/activities/Activity'
import type { ActivityRepository } from './ActivityRepository'

export type CompleteActivityResult =
  | { status: 'completed'; activity: Activity }
  | { status: 'not-found' }
  | { status: 'not-active'; activity: Activity }

export interface CompleteActivityDependencies {
  activityRepository: ActivityRepository
  activityId: string
  now?: () => Date
}

export async function completeActivity({
  activityRepository,
  activityId,
  now = () => new Date(),
}: CompleteActivityDependencies): Promise<CompleteActivityResult> {
  const current = await activityRepository.getById(activityId)
  if (!current) return { status: 'not-found' }
  if (current.status !== 'active') return { status: 'not-active', activity: current }

  const completed = completeActivityRecord(current, now().toISOString())
  const persisted = await activityRepository.updateIfStatus(completed, ['active'])

  if (!persisted) {
    const latest = await activityRepository.getById(activityId)
    if (!latest) return { status: 'not-found' }
    return { status: 'not-active', activity: latest }
  }

  return { status: 'completed', activity: completed }
}
