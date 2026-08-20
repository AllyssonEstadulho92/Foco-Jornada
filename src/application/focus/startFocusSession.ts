import type { ActivityRepository } from '../activities/ActivityRepository'
import type { BreakRepository } from '../breaks/BreakRepository'
import type { JourneyRepository } from '../journey/JourneyRepository'
import {
  createFocusSession,
  getPomodoroDurationSeconds,
  type FocusMode,
  type FocusSegmentType,
  type FocusSession,
} from '../../domain/focus/FocusSession'
import type { FocusRepository } from './FocusRepository'

export type StartFocusResult =
  | { status: 'started'; session: FocusSession }
  | { status: 'no-active-journey' }
  | { status: 'break-active' }
  | { status: 'already-open'; session: FocusSession }
  | { status: 'activity-not-active' }

export interface StartFocusDependencies {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
  mode: FocusMode
  segmentType?: FocusSegmentType
  plannedDurationSeconds?: number
  cycle?: number
  activityId?: string
  now?: () => Date
  createId?: () => string
}

export async function startFocusSession({
  journeyRepository,
  breakRepository,
  activityRepository,
  focusRepository,
  mode,
  segmentType = 'focus',
  plannedDurationSeconds,
  cycle = 1,
  activityId,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}: StartFocusDependencies): Promise<StartFocusResult> {
  const journey = await journeyRepository.getActive()
  if (!journey) return { status: 'no-active-journey' }

  if (await breakRepository.getActiveForJourney(journey.id)) {
    return { status: 'break-active' }
  }

  const existing = await focusRepository.getOpenForJourney(journey.id)
  if (existing) return { status: 'already-open', session: existing }

  if (activityId) {
    const activeActivity = await activityRepository.getActiveForJourney(journey.id)
    if (!activeActivity || activeActivity.id !== activityId) {
      return { status: 'activity-not-active' }
    }
  }

  const duration =
    mode === 'pomodoro'
      ? getPomodoroDurationSeconds(segmentType)
      : (plannedDurationSeconds ?? 25 * 60)

  const session = createFocusSession({
    id: createId(),
    journeyId: journey.id,
    activityId,
    mode,
    segmentType: mode === 'custom' ? 'focus' : segmentType,
    plannedDurationSeconds: duration,
    cycle,
    now: now().toISOString(),
  })

  const created = await focusRepository.createIfNoOpen(session)
  if (!created) {
    const concurrent = await focusRepository.getOpenForJourney(journey.id)
    if (concurrent) return { status: 'already-open', session: concurrent }
  }

  return { status: 'started', session }
}
