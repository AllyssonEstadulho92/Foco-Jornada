import type { Journey } from '../../domain/journey/Journey'

export interface JourneyRepository {
  getActive(): Promise<Journey | undefined>
  getById(id: string): Promise<Journey | undefined>
  createIfNoActive(journey: Journey): Promise<boolean>
  finishIfActive(journey: Journey): Promise<boolean>
  listByDate(date: string): Promise<Journey[]>
  deleteById?(id: string): Promise<void>
}
