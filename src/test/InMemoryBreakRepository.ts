import type { BreakRepository } from '../application/breaks/BreakRepository'
import type { BreakRecord } from '../domain/breaks/BreakRecord'

export class InMemoryBreakRepository implements BreakRepository {
  private records = new Map<string, BreakRecord>()

  async getActiveForJourney(journeyId: string): Promise<BreakRecord | undefined> {
    return [...this.records.values()].find(
      (record) => record.journeyId === journeyId && record.status === 'active',
    )
  }

  async createIfNoActive(record: BreakRecord): Promise<boolean> {
    if (await this.getActiveForJourney(record.journeyId)) {
      return false
    }

    this.records.set(record.id, record)
    return true
  }

  async finishIfActive(record: BreakRecord): Promise<boolean> {
    const current = this.records.get(record.id)

    if (!current || current.status !== 'active') {
      return false
    }

    this.records.set(record.id, record)
    return true
  }

  async listByJourney(journeyId: string): Promise<BreakRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.journeyId === journeyId)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  }

  snapshot(): BreakRecord[] {
    return [...this.records.values()]
  }
}
