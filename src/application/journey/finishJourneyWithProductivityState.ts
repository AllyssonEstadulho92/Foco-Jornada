import type { ActivityRepository } from '../activities/ActivityRepository'
import type { BreakRepository } from '../breaks/BreakRepository'
import { cancelFocusSession } from '../focus/cancelFocusSession'
import type { FocusRepository } from '../focus/FocusRepository'
import type { JourneyRepository } from './JourneyRepository'
import type { FinishJourneyResult } from './finishJourney'
import { finishJourneyWithWorkState } from './finishJourneyWithWorkState'

export interface FinishJourneyWithProductivityStateDependencies {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
  journeyId: string
  now?: () => Date
}

export async function finishJourneyWithProductivityState({
  journeyRepository,
  breakRepository,
  activityRepository,
  focusRepository,
  journeyId,
  now = () => new Date(),
}: FinishJourneyWithProductivityStateDependencies): Promise<FinishJourneyResult> {
  const openFocus = await focusRepository.getOpenForJourney(journeyId)

  if (openFocus) {
    await cancelFocusSession({
      focusRepository,
      journeyId,
      now,
    })
  }

  return finishJourneyWithWorkState({
    journeyRepository,
    breakRepository,
    activityRepository,
    journeyId,
    now,
  })
}
