import type { BreakRecord } from '../../domain/breaks/BreakRecord'

export interface BreakRepository {
  getActiveForJourney(journeyId: string): Promise<BreakRecord | undefined>
  createIfNoActive(record: BreakRecord): Promise<boolean>
  finishIfActive(record: BreakRecord): Promise<boolean>
  listByJourney(journeyId: string): Promise<BreakRecord[]>
}
