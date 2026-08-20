import type { ActivityRepository } from '../../application/activities/ActivityRepository'
import type { Activity, ActivityStatus } from '../../domain/activities/Activity'
import type { AppDatabase } from '../database/appDatabase'

export class DexieActivityRepository implements ActivityRepository {
  constructor(private readonly database: AppDatabase) {}

  async create(activity: Activity): Promise<void> {
    await this.database.activities.add(activity)
  }

  async getById(id: string): Promise<Activity | undefined> {
    return this.database.activities.get(id)
  }

  async getActiveForJourney(journeyId: string): Promise<Activity | undefined> {
    return this.database.activities
      .where('journeyId')
      .equals(journeyId)
      .filter((activity) => activity.status === 'active')
      .first()
  }

  async listByJourney(journeyId: string): Promise<Activity[]> {
    return this.database.activities.where('journeyId').equals(journeyId).sortBy('createdAt')
  }

  async updateIfStatus(activity: Activity, allowedStatuses: ActivityStatus[]): Promise<boolean> {
    return this.database.transaction('rw', this.database.activities, async () => {
      const current = await this.database.activities.get(activity.id)
      if (!current || !allowedStatuses.includes(current.status)) return false

      await this.database.activities.put(activity)
      return true
    })
  }

  async startIfNoActive(activity: Activity): Promise<boolean> {
    return this.database.transaction('rw', this.database.activities, async () => {
      const current = await this.database.activities.get(activity.id)
      if (!current || current.status !== 'pending') return false

      const active = await this.database.activities
        .where('journeyId')
        .equals(activity.journeyId)
        .filter((item) => item.status === 'active')
        .first()

      if (active) return false

      await this.database.activities.put(activity)
      return true
    })
  }
}
