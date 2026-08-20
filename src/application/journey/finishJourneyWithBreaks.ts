import type { BreakRepository } from '../breaks/BreakRepository'
import { finishBreak } from '../breaks/finishBreak'
import type { JourneyRepository } from './JourneyRepository'
import { finishJourney, type FinishJourneyResult } from './finishJourney'

export interface FinishJourneyWithBreaksDependencies {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  journeyId: string
  now?: () => Date
}

export async function finishJourneyWithBreaks({
  journeyRepository,
  breakRepository,
  journeyId,
  now = () => new Date(),
}: FinishJourneyWithBreaksDependencies): Promise<FinishJourneyResult> {
  const activeBreak = await breakRepository.getActiveForJourney(journeyId)

  if (activeBreak) {
    await finishBreak({
      breakRepository,
      journeyId,
      now,
    })
  }

  return finishJourney({
    repository: journeyRepository,
    journeyId,
    now,
  })
}
