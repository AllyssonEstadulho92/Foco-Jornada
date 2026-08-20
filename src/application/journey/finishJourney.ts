import { finishJourney as finishJourneyEntity, type Journey } from '../../domain/journey/Journey'
import type { JourneyRepository } from './JourneyRepository'

export type FinishJourneyResult =
  | { status: 'finished'; journey: Journey }
  | { status: 'not-active' }
  | { status: 'different-active-journey'; journey: Journey }

export interface FinishJourneyDependencies {
  repository: JourneyRepository
  journeyId: string
  now?: () => Date
}

export async function finishJourney({
  repository,
  journeyId,
  now = () => new Date(),
}: FinishJourneyDependencies): Promise<FinishJourneyResult> {
  const activeJourney = await repository.getActive()

  if (!activeJourney) {
    return { status: 'not-active' }
  }

  if (activeJourney.id !== journeyId) {
    return { status: 'different-active-journey', journey: activeJourney }
  }

  const finished = finishJourneyEntity(activeJourney, now().toISOString())
  const persisted = await repository.finishIfActive(finished)

  if (!persisted) {
    return { status: 'not-active' }
  }

  return { status: 'finished', journey: finished }
}
