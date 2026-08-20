import { editActivity as editActivityEntity, type Activity } from '../../domain/activities/Activity'
import type { ActivityRepository } from './ActivityRepository'

export type EditActivityResult =
  | { status: 'updated'; activity: Activity }
  | { status: 'not-found' }
  | { status: 'not-editable'; activity: Activity }

export interface EditActivityDependencies {
  activityRepository: ActivityRepository
  activityId: string
  name: string
  description?: string
  now?: () => Date
}

export async function editActivity({
  activityRepository,
  activityId,
  name,
  description,
  now = () => new Date(),
}: EditActivityDependencies): Promise<EditActivityResult> {
  const current = await activityRepository.getById(activityId)
  if (!current) return { status: 'not-found' }

  if (current.status === 'completed' || current.status === 'cancelled') {
    return { status: 'not-editable', activity: current }
  }

  const updated = editActivityEntity(current, name, description, now().toISOString())
  const persisted = await activityRepository.updateIfStatus(updated, ['pending', 'active'])

  if (!persisted) {
    const latest = await activityRepository.getById(activityId)
    if (!latest) return { status: 'not-found' }
    return { status: 'not-editable', activity: latest }
  }

  return { status: 'updated', activity: updated }
}
