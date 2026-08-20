import type { FocusRepository } from '../application/focus/FocusRepository'
import type { FocusSession, FocusStatus } from '../domain/focus/FocusSession'

export class InMemoryFocusRepository implements FocusRepository {
  private sessions = new Map<string, FocusSession>()

  async createIfNoOpen(session: FocusSession): Promise<boolean> {
    if (await this.getOpenForJourney(session.journeyId)) return false
    this.sessions.set(session.id, session)
    return true
  }

  async getById(id: string): Promise<FocusSession | undefined> {
    return this.sessions.get(id)
  }

  async getOpenForJourney(journeyId: string): Promise<FocusSession | undefined> {
    return [...this.sessions.values()].find(
      (session) =>
        session.journeyId === journeyId &&
        (session.status === 'running' || session.status === 'paused'),
    )
  }

  async listByJourney(journeyId: string): Promise<FocusSession[]> {
    return [...this.sessions.values()]
      .filter((session) => session.journeyId === journeyId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async updateIfStatus(session: FocusSession, allowedStatuses: FocusStatus[]): Promise<boolean> {
    const current = this.sessions.get(session.id)
    if (!current || !allowedStatuses.includes(current.status)) return false
    this.sessions.set(session.id, session)
    return true
  }

  snapshot(): FocusSession[] {
    return [...this.sessions.values()]
  }
}
