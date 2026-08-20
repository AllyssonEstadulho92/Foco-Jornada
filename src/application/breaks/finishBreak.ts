import { finishBreakRecord, type BreakRecord } from '../../domain/breaks/BreakRecord'
import type { BreakRepository } from './BreakRepository'

export type FinishBreakResult =
  | { status: 'finished'; breakRecord: BreakRecord }
  | { status: 'not-active' }

export interface FinishBreakDependencies {
  breakRepository: BreakRepository
  journeyId: string
  now?: () => Date
}

export async function finishBreak({
  breakRepository,
  journeyId,
  now = () => new Date(),
}: FinishBreakDependencies): Promise<FinishBreakResult> {
  const activeBreak = await breakRepository.getActiveForJourney(journeyId)

  if (!activeBreak) {
    return { status: 'not-active' }
  }

  const finished = finishBreakRecord(activeBreak, now().toISOString())
  const persisted = await breakRepository.finishIfActive(finished)

  if (!persisted) {
    return { status: 'not-active' }
  }

  return { status: 'finished', breakRecord: finished }
}
