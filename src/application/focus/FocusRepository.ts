import type { FocusSession, FocusStatus } from '../../domain/focus/FocusSession'

export interface FocusRepository {
  createIfNoOpen(session: FocusSession): Promise<boolean>
  getById(id: string): Promise<FocusSession | undefined>
  getOpenForJourney(journeyId: string): Promise<FocusSession | undefined>
  listByJourney(journeyId: string): Promise<FocusSession[]>
  updateIfStatus(session: FocusSession, allowedStatuses: FocusStatus[]): Promise<boolean>
}
