import type { CoffeeRecord } from '../../domain/coffee/CoffeeRecord'

export interface CoffeeRepository {
  add(record: CoffeeRecord): Promise<void>
  listByDate(date: string): Promise<CoffeeRecord[]>
  listByJourney(journeyId: string): Promise<CoffeeRecord[]>
  deleteById?(id: string): Promise<void>
}
