import type { Activity, ActivityStatus } from '../../domain/activities/Activity'

export interface ActivityRepository {
  create(activity: Activity): Promise<void>
  getById(id: string): Promise<Activity | undefined>
  getActiveForJourney(journeyId: string): Promise<Activity | undefined>
  listByJourney(journeyId: string): Promise<Activity[]>
  updateIfStatus(activity: Activity, allowedStatuses: ActivityStatus[]): Promise<boolean>
  startIfNoActive(activity: Activity): Promise<boolean>
}
