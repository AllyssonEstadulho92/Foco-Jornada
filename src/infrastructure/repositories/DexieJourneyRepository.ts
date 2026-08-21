import type { JourneyRepository } from '../../application/journey/JourneyRepository'
import type { Journey } from '../../domain/journey/Journey'
import type { AppDatabase } from '../database/appDatabase'

export class DexieJourneyRepository implements JourneyRepository {
  constructor(private readonly database: AppDatabase) {}

  async getActive(): Promise<Journey | undefined> {
    return this.database.journeys.where('status').equals('active').first()
  }

  async getById(id: string): Promise<Journey | undefined> {
    return this.database.journeys.get(id)
  }

  async createIfNoActive(journey: Journey): Promise<boolean> {
    return this.database.transaction('rw', this.database.journeys, async () => {
      const active = await this.database.journeys.where('status').equals('active').first()

      if (active) {
        return false
      }

      await this.database.journeys.add(journey)
      return true
    })
  }

  async finishIfActive(journey: Journey): Promise<boolean> {
    return this.database.transaction('rw', this.database.journeys, async () => {
      const current = await this.database.journeys.get(journey.id)

      if (!current || current.status !== 'active') {
        return false
      }

      await this.database.journeys.put(journey)
      return true
    })
  }

  async listByDate(date: string): Promise<Journey[]> {
    const journeys = await this.database.journeys.where('date').equals(date).sortBy('startedAt')
    return journeys.reverse()
  }

  async deleteById(id: string): Promise<void> {
    await this.database.transaction(
      'rw',
      this.database.journeys,
      this.database.breaks,
      this.database.activities,
      this.database.focusSessions,
      this.database.coffeeRecords,
      async () => {
        await Promise.all([
          this.database.breaks.where('journeyId').equals(id).delete(),
          this.database.activities.where('journeyId').equals(id).delete(),
          this.database.focusSessions.where('journeyId').equals(id).delete(),
          this.database.coffeeRecords.where('journeyId').equals(id).delete(),
        ])
        await this.database.journeys.delete(id)
      },
    )
  }
}
