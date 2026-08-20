import type { CoffeeRepository } from '../application/coffee/CoffeeRepository'
import type { CoffeeRecord } from '../domain/coffee/CoffeeRecord'

export class InMemoryCoffeeRepository implements CoffeeRepository {
  private records: CoffeeRecord[] = []

  async add(record: CoffeeRecord): Promise<void> {
    this.records.push(record)
  }

  async listByDate(date: string): Promise<CoffeeRecord[]> {
    return this.records.filter((record) => record.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async listByJourney(journeyId: string): Promise<CoffeeRecord[]> {
    return this.records.filter((record) => record.journeyId === journeyId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  snapshot(): CoffeeRecord[] {
    return [...this.records]
  }
}
