import type { ActivityRepository } from '../activities/ActivityRepository'
import { completeActivity } from '../activities/completeActivity'
import type { BreakRepository } from '../breaks/BreakRepository'
import type { JourneyRepository } from './JourneyRepository'
import { finishJourneyWithBreaks } from './finishJourneyWithBreaks'
import type { FinishJourneyResult } from './finishJourney'

export interface FinishJourneyWithWorkStateDependencies {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  journeyId: string
  now?: () => Date
}

export async function finishJourneyWithWorkState({
  journeyRepository,
  breakRepository,
  activityRepository,
  journeyId,
  now = () => new Date(),
}: FinishJourneyWithWorkStateDependencies): Promise<FinishJourneyResult> {
  const activeActivity = await activityRepository.getActiveForJourney(journeyId)

  if (activeActivity) {
    await completeActivity({
      activityRepository,
      activityId: activeActivity.id,
      now,
    })
  }

  return finishJourneyWithBreaks({
    journeyRepository,
    breakRepository,
    journeyId,
    now,
  })
}
