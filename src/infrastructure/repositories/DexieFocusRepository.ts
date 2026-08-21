import type { FocusRepository } from '../../application/focus/FocusRepository'
import type { FocusSession, FocusStatus } from '../../domain/focus/FocusSession'
import type { AppDatabase } from '../database/appDatabase'

export class DexieFocusRepository implements FocusRepository {
  constructor(private readonly database: AppDatabase) {}

  async createIfNoOpen(session: FocusSession): Promise<boolean> {
    return this.database.transaction('rw', this.database.focusSessions, async () => {
      const open = await this.database.focusSessions
        .where('journeyId')
        .equals(session.journeyId)
        .filter((item) => item.status === 'running' || item.status === 'paused')
        .first()

      if (open) return false
      await this.database.focusSessions.add(session)
      return true
    })
  }

  async getById(id: string): Promise<FocusSession | undefined> {
    return this.database.focusSessions.get(id)
  }

  async getOpenForJourney(journeyId: string): Promise<FocusSession | undefined> {
    return this.database.focusSessions
      .where('journeyId')
      .equals(journeyId)
      .filter((session) => session.status === 'running' || session.status === 'paused')
      .first()
  }

  async listByJourney(journeyId: string): Promise<FocusSession[]> {
    return this.database.focusSessions.where('journeyId').equals(journeyId).sortBy('createdAt')
  }

  async updateIfStatus(session: FocusSession, allowedStatuses: FocusStatus[]): Promise<boolean> {
    return this.database.transaction('rw', this.database.focusSessions, async () => {
      const current = await this.database.focusSessions.get(session.id)
      if (!current || !allowedStatuses.includes(current.status)) return false
      await this.database.focusSessions.put(session)
      return true
    })
  }

  async deleteById(id: string): Promise<void> {
    await this.database.focusSessions.delete(id)
  }
}
