import type { ActivityRepository } from '../application/activities/ActivityRepository'
import type { Activity, ActivityStatus } from '../domain/activities/Activity'

export class InMemoryActivityRepository implements ActivityRepository {
  private records = new Map<string, Activity>()

  async create(activity: Activity): Promise<void> {
    this.records.set(activity.id, activity)
  }

  async getById(id: string): Promise<Activity | undefined> {
    return this.records.get(id)
  }

  async getActiveForJourney(journeyId: string): Promise<Activity | undefined> {
    return [...this.records.values()].find(
      (activity) => activity.journeyId === journeyId && activity.status === 'active',
    )
  }

  async listByJourney(journeyId: string): Promise<Activity[]> {
    return [...this.records.values()]
      .filter((activity) => activity.journeyId === journeyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async updateIfStatus(activity: Activity, allowedStatuses: ActivityStatus[]): Promise<boolean> {
    const current = this.records.get(activity.id)
    if (!current || !allowedStatuses.includes(current.status)) return false

    this.records.set(activity.id, activity)
    return true
  }

  async startIfNoActive(activity: Activity): Promise<boolean> {
    const current = this.records.get(activity.id)
    if (!current || current.status !== 'pending') return false
    if (await this.getActiveForJourney(activity.journeyId)) return false

    this.records.set(activity.id, activity)
    return true
  }

  snapshot(): Activity[] {
    return [...this.records.values()]
  }
}
