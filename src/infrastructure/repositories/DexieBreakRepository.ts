import type { BreakRepository } from '../../application/breaks/BreakRepository'
import type { BreakRecord } from '../../domain/breaks/BreakRecord'
import type { AppDatabase } from '../database/appDatabase'

export class DexieBreakRepository implements BreakRepository {
  constructor(private readonly database: AppDatabase) {}

  async getActiveForJourney(journeyId: string): Promise<BreakRecord | undefined> {
    return this.database.breaks
      .where('journeyId')
      .equals(journeyId)
      .filter((record) => record.status === 'active')
      .first()
  }

  async createIfNoActive(record: BreakRecord): Promise<boolean> {
    return this.database.transaction('rw', this.database.breaks, async () => {
      const active = await this.database.breaks
        .where('journeyId')
        .equals(record.journeyId)
        .filter((item) => item.status === 'active')
        .first()

      if (active) {
        return false
      }

      await this.database.breaks.add(record)
      return true
    })
  }

  async finishIfActive(record: BreakRecord): Promise<boolean> {
    return this.database.transaction('rw', this.database.breaks, async () => {
      const current = await this.database.breaks.get(record.id)

      if (!current || current.status !== 'active') {
        return false
      }

      await this.database.breaks.put(record)
      return true
    })
  }

  async listByJourney(journeyId: string): Promise<BreakRecord[]> {
    return this.database.breaks.where('journeyId').equals(journeyId).sortBy('startedAt')
  }

  async deleteById(id: string): Promise<void> {
    await this.database.breaks.delete(id)
  }
}
