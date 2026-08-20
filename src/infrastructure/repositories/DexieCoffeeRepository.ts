import type { CoffeeRepository } from '../../application/coffee/CoffeeRepository'
import type { CoffeeRecord } from '../../domain/coffee/CoffeeRecord'
import type { AppDatabase } from '../database/appDatabase'

export class DexieCoffeeRepository implements CoffeeRepository {
  constructor(private readonly database: AppDatabase) {}

  async add(record: CoffeeRecord): Promise<void> {
    await this.database.coffeeRecords.add(record)
  }

  async listByDate(date: string): Promise<CoffeeRecord[]> {
    return this.database.coffeeRecords.where('date').equals(date).sortBy('createdAt')
  }

  async listByJourney(journeyId: string): Promise<CoffeeRecord[]> {
    return this.database.coffeeRecords.where('journeyId').equals(journeyId).sortBy('createdAt')
  }
}
