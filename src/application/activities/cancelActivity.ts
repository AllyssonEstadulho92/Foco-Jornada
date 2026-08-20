import { cancelActivityRecord, type Activity } from '../../domain/activities/Activity'
import type { ActivityRepository } from './ActivityRepository'

export type CancelActivityResult =
  | { status: 'cancelled'; activity: Activity }
  | { status: 'not-found' }
  | { status: 'already-closed'; activity: Activity }

export interface CancelActivityDependencies {
  activityRepository: ActivityRepository
  activityId: string
  now?: () => Date
}

export async function cancelActivity({
  activityRepository,
  activityId,
  now = () => new Date(),
}: CancelActivityDependencies): Promise<CancelActivityResult> {
  const current = await activityRepository.getById(activityId)
  if (!current) return { status: 'not-found' }

  if (current.status === 'completed' || current.status === 'cancelled') {
    return { status: 'already-closed', activity: current }
  }

  const cancelled = cancelActivityRecord(current, now().toISOString())
  const persisted = await activityRepository.updateIfStatus(cancelled, ['pending', 'active'])

  if (!persisted) {
    const latest = await activityRepository.getById(activityId)
    if (!latest) return { status: 'not-found' }
    return { status: 'already-closed', activity: latest }
  }

  return { status: 'cancelled', activity: cancelled }
}
