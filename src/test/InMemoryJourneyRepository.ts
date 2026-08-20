import type { JourneyRepository } from '../application/journey/JourneyRepository'
import type { Journey } from '../domain/journey/Journey'

export class InMemoryJourneyRepository implements JourneyRepository {
  private journeys = new Map<string, Journey>()

  async getActive(): Promise<Journey | undefined> {
    return [...this.journeys.values()].find((journey) => journey.status === 'active')
  }

  async getById(id: string): Promise<Journey | undefined> {
    return this.journeys.get(id)
  }

  async createIfNoActive(journey: Journey): Promise<boolean> {
    if (await this.getActive()) {
      return false
    }

    this.journeys.set(journey.id, journey)
    return true
  }

  async update(journey: Journey): Promise<void> {
    this.journeys.set(journey.id, journey)
  }

  async listByDate(date: string): Promise<Journey[]> {
    return [...this.journeys.values()]
      .filter((journey) => journey.date === date)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  }

  snapshot(): Journey[] {
    return [...this.journeys.values()]
  }
}
