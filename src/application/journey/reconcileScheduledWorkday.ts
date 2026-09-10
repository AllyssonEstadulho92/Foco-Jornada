import { finishBreak } from '../breaks/finishBreak'
import { startBreak } from '../breaks/startBreak'
import type { BreakRepository } from '../breaks/BreakRepository'
import type { ActivityRepository } from '../activities/ActivityRepository'
import { pauseFocusSession } from '../focus/pauseFocusSession'
import type { FocusRepository } from '../focus/FocusRepository'
import type { SettingsRepository } from '../settings/SettingsRepository'
import { getResolvedScheduledBreaks, parseClockMinutes, resolveWorkScheduleForDate } from '../../domain/journey/WorkSchedule'
import type { Journey } from '../../domain/journey/Journey'
import type { BreakRecord } from '../../domain/breaks/BreakRecord'
import type { JourneyRepository } from './JourneyRepository'
import { finishJourneyWithProductivityState } from './finishJourneyWithProductivityState'
import { startJourney } from './startJourney'

export type ScheduledWorkdayAction =
  | 'journey-started'
  | 'break-started'
  | 'break-finished'
  | 'focus-paused'
  | 'journey-finished'

export interface ReconcileScheduledWorkdayDependencies {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
  settingsRepository: SettingsRepository
  now?: () => Date
}

function localClockDate(base: Date, clock: string): Date | null {
  const minutes = parseClockMinutes(clock)
  if (minutes === null) return null

  const value = new Date(base)
  value.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return value
}

function overlaps(record: BreakRecord, startAt: Date, endAt: Date, fallbackEnd: Date): boolean {
  const recordStart = Date.parse(record.startedAt)
  const recordEnd = Date.parse(record.endedAt ?? fallbackEnd.toISOString())
  if (!Number.isFinite(recordStart) || !Number.isFinite(recordEnd)) return false
  return recordStart < endAt.getTime() && recordEnd > startAt.getTime()
}

function scheduledJourneyId(dateKey: string): string {
  return `scheduled-journey-${dateKey}`
}

function scheduledBreakId(dateKey: string, breakId: string): string {
  return `scheduled-${dateKey}-${breakId}`
}

async function reconcileBreaks(
  dependencies: ReconcileScheduledWorkdayDependencies,
  journey: Journey,
  current: Date,
  shiftEnd: Date,
): Promise<ScheduledWorkdayAction[]> {
  const {
    breakRepository,
    focusRepository,
    journeyRepository,
    settingsRepository,
  } = dependencies
  const settings = await settingsRepository.get()
  const scheduledBreaks = getResolvedScheduledBreaks(settings.workSchedule, current)
  if (!scheduledBreaks.length) return []

  const actions: ScheduledWorkdayAction[] = []
  let records = await breakRepository.listByJourney(journey.id)

  for (const scheduled of scheduledBreaks) {
    const configuredStart = localClockDate(current, scheduled.startTime)
    const configuredEnd = localClockDate(current, scheduled.endTime)
    if (!configuredStart || !configuredEnd) continue

    const journeyStartMs = Date.parse(journey.startedAt)
    const effectiveStart = Number.isFinite(journeyStartMs) && journeyStartMs > configuredStart.getTime()
      ? new Date(journeyStartMs)
      : configuredStart
    const effectiveEnd = configuredEnd.getTime() > shiftEnd.getTime() ? shiftEnd : configuredEnd
    if (effectiveEnd.getTime() <= effectiveStart.getTime()) continue

    const automaticId = scheduledBreakId(journey.date, scheduled.id)
    const currentMs = current.getTime()
    let matchingRecord = records.find((record) => record.id === automaticId)
      ?? records.find((record) => record.status !== 'cancelled' && overlaps(record, effectiveStart, effectiveEnd, current))

    if (matchingRecord?.id === automaticId && matchingRecord.status === 'active' && currentMs >= effectiveEnd.getTime()) {
      const result = await finishBreak({
        breakRepository,
        journeyId: journey.id,
        now: () => effectiveEnd,
      })
      if (result.status === 'finished') {
        actions.push('break-finished')
        records = await breakRepository.listByJourney(journey.id)
        matchingRecord = records.find((record) => record.id === automaticId)
      }
    }

    if (matchingRecord || currentMs < effectiveStart.getTime()) continue

    const activeBreak = await breakRepository.getActiveForJourney(journey.id)
    if (activeBreak) continue

    if (currentMs < effectiveEnd.getTime()) {
      const openFocus = await focusRepository.getOpenForJourney(journey.id)
      if (openFocus?.status === 'running') {
        const paused = await pauseFocusSession({
          focusRepository,
          journeyId: journey.id,
          now: () => current,
        })
        if (paused.status === 'paused') actions.push('focus-paused')
      }
    }

    const started = await startBreak({
      journeyRepository,
      breakRepository,
      type: 'custom',
      plannedDurationMinutes: scheduled.durationMinutes,
      now: () => effectiveStart,
      createId: () => automaticId,
    })

    if (started.status !== 'started') continue
    actions.push('break-started')

    if (currentMs >= effectiveEnd.getTime()) {
      const finished = await finishBreak({
        breakRepository,
        journeyId: journey.id,
        now: () => effectiveEnd,
      })
      if (finished.status === 'finished') actions.push('break-finished')
    }

    records = await breakRepository.listByJourney(journey.id)
  }

  return actions
}

export async function reconcileScheduledWorkday({
  journeyRepository,
  breakRepository,
  activityRepository,
  focusRepository,
  settingsRepository,
  now = () => new Date(),
}: ReconcileScheduledWorkdayDependencies): Promise<ScheduledWorkdayAction[]> {
  const current = now()
  const settings = await settingsRepository.get()
  const resolved = resolveWorkScheduleForDate(settings.workSchedule, current)
  if (!resolved.isWorkingDay) return []

  const shiftStart = localClockDate(current, resolved.startTime)
  const shiftEnd = localClockDate(current, resolved.endTime)
  if (!shiftStart || !shiftEnd || shiftEnd.getTime() <= shiftStart.getTime()) return []

  const currentMs = current.getTime()
  let activeJourney = await journeyRepository.getActive()
  const todayJourneys = await journeyRepository.listByDate(resolved.dateKey)
  const actions: ScheduledWorkdayAction[] = []

  if (
    !activeJourney
    && todayJourneys.length === 0
    && currentMs >= shiftStart.getTime()
    && currentMs < shiftEnd.getTime()
  ) {
    const started = await startJourney({
      repository: journeyRepository,
      now: () => shiftStart,
      createId: () => scheduledJourneyId(resolved.dateKey),
    })
    activeJourney = started.journey
    if (started.status === 'started') actions.push('journey-started')
  }

  if (!activeJourney || activeJourney.date !== resolved.dateKey) return actions

  actions.push(...await reconcileBreaks(
    { journeyRepository, breakRepository, activityRepository, focusRepository, settingsRepository, now },
    activeJourney,
    current,
    shiftEnd,
  ))

  if (currentMs >= shiftEnd.getTime()) {
    const finished = await finishJourneyWithProductivityState({
      journeyRepository,
      breakRepository,
      activityRepository,
      focusRepository,
      journeyId: activeJourney.id,
      now: () => shiftEnd,
    })
    if (finished.status === 'finished') actions.push('journey-finished')
  }

  return actions
}
