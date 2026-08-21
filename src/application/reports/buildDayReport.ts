import { getActivityDurationMs, type Activity } from '../../domain/activities/Activity'
import { getBreakDurationMs, type BreakRecord } from '../../domain/breaks/BreakRecord'
import type { CoffeeRecord } from '../../domain/coffee/CoffeeRecord'
import { getFocusElapsedMs, type FocusSession } from '../../domain/focus/FocusSession'
import { getJourneyDurationMs, type Journey } from '../../domain/journey/Journey'
import type { ActivityRepository } from '../activities/ActivityRepository'
import type { BreakRepository } from '../breaks/BreakRepository'
import type { CoffeeRepository } from '../coffee/CoffeeRepository'
import type { FocusRepository } from '../focus/FocusRepository'
import { getEffectiveJourneyDurationMs } from '../journey/getEffectiveJourneyDuration'
import type { JourneyRepository } from '../journey/JourneyRepository'

export type DayEventType =
  | 'journey-start'
  | 'journey-end'
  | 'break-start'
  | 'break-end'
  | 'activity-start'
  | 'activity-end'
  | 'focus-start'
  | 'focus-end'
  | 'coffee'

export type DayRecordType = 'journey' | 'break' | 'activity' | 'focus' | 'coffee'

export interface DayEvent {
  id: string
  type: DayEventType
  recordType: DayRecordType
  recordId: string
  deletable: boolean
  timestamp: string
  label: string
  detail?: string
}

export interface DayReport {
  date: string
  journeys: Journey[]
  breaks: BreakRecord[]
  activities: Activity[]
  focusSessions: FocusSession[]
  coffees: CoffeeRecord[]
  events: DayEvent[]
  summary: {
    journeyMs: number
    effectiveMs: number
    breakMs: number
    focusMs: number
    activityCount: number
    coffeeCount: number
    coffeeCost: number
  }
}

export async function buildDayReport({
  journeyRepository,
  breakRepository,
  activityRepository,
  focusRepository,
  coffeeRepository,
  date,
  now = () => new Date(),
}: {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
  coffeeRepository: CoffeeRepository
  date: string
  now?: () => Date
}): Promise<DayReport> {
  const journeys = await journeyRepository.listByDate(date)
  const coffees = await coffeeRepository.listByDate(date)
  const nowIso = now().toISOString()

  const perJourney = await Promise.all(
    journeys.map(async (journey) => {
      const [breaks, activities, focusSessions] = await Promise.all([
        breakRepository.listByJourney(journey.id),
        activityRepository.listByJourney(journey.id),
        focusRepository.listByJourney(journey.id),
      ])
      return { journey, breaks, activities, focusSessions }
    }),
  )

  const breaks = perJourney.flatMap((item) => item.breaks)
  const activities = perJourney.flatMap((item) => item.activities)
  const focusSessions = perJourney.flatMap((item) => item.focusSessions)

  const journeyMs = perJourney.reduce(
    (sum, { journey }) => sum + getJourneyDurationMs(journey, journey.endedAt ?? nowIso),
    0,
  )
  const breakMs = breaks
    .filter((record) => record.status !== 'cancelled')
    .reduce((sum, record) => sum + getBreakDurationMs(record, record.endedAt ?? nowIso), 0)
  const effectiveMs = perJourney.reduce(
    (sum, { journey, breaks: journeyBreaks }) =>
      sum + getEffectiveJourneyDurationMs(journey, journeyBreaks, journey.endedAt ?? nowIso),
    0,
  )
  const focusMs = focusSessions
    .filter((session) => session.segmentType === 'focus' && session.status !== 'cancelled')
    .reduce(
      (sum, session) => sum + getFocusElapsedMs(session, session.endedAt ?? nowIso),
      0,
    )
  const coffeeCount = coffees.reduce((sum, record) => sum + record.quantity, 0)
  const coffeeCost = Math.round(coffees.reduce((sum, record) => sum + record.totalPrice, 0) * 100) / 100

  const events: DayEvent[] = []
  for (const journey of journeys) {
    const deletable = journey.status !== 'active'
    events.push({
      id: `${journey.id}-start`,
      type: 'journey-start',
      recordType: 'journey',
      recordId: journey.id,
      deletable,
      timestamp: journey.startedAt,
      label: 'Entrada na jornada',
    })
    if (journey.endedAt) {
      events.push({
        id: `${journey.id}-end`,
        type: 'journey-end',
        recordType: 'journey',
        recordId: journey.id,
        deletable,
        timestamp: journey.endedAt,
        label: 'Saída da jornada',
      })
    }
  }
  for (const record of breaks) {
    const deletable = record.status !== 'active'
    events.push({
      id: `${record.id}-start`,
      type: 'break-start',
      recordType: 'break',
      recordId: record.id,
      deletable,
      timestamp: record.startedAt,
      label: 'Pausa iniciada',
      detail: record.plannedDurationMinutes ? `${record.plannedDurationMinutes} min previstos` : undefined,
    })
    if (record.endedAt) {
      events.push({
        id: `${record.id}-end`,
        type: 'break-end',
        recordType: 'break',
        recordId: record.id,
        deletable,
        timestamp: record.endedAt,
        label: 'Pausa terminada',
      })
    }
  }
  for (const activity of activities) {
    const deletable = activity.status !== 'active'
    if (activity.startedAt) {
      events.push({
        id: `${activity.id}-start`,
        type: 'activity-start',
        recordType: 'activity',
        recordId: activity.id,
        deletable,
        timestamp: activity.startedAt,
        label: 'Atividade iniciada',
        detail: activity.name,
      })
    }
    if (activity.endedAt) {
      events.push({
        id: `${activity.id}-end`,
        type: 'activity-end',
        recordType: 'activity',
        recordId: activity.id,
        deletable,
        timestamp: activity.endedAt,
        label: activity.status === 'cancelled' ? 'Atividade cancelada' : 'Atividade terminada',
        detail: `${activity.name} · ${Math.floor(getActivityDurationMs(activity, activity.endedAt) / 60000)} min`,
      })
    }
  }
  for (const session of focusSessions) {
    const deletable = session.status !== 'running' && session.status !== 'paused'
    events.push({
      id: `${session.id}-start`,
      type: 'focus-start',
      recordType: 'focus',
      recordId: session.id,
      deletable,
      timestamp: session.startedAt,
      label: session.segmentType === 'focus' ? 'Sessão de foco iniciada' : 'Pausa Pomodoro iniciada',
      detail: session.mode === 'pomodoro' ? `Ciclo ${session.cycle}/4` : 'Personalizada',
    })
    if (session.endedAt) {
      events.push({
        id: `${session.id}-end`,
        type: 'focus-end',
        recordType: 'focus',
        recordId: session.id,
        deletable,
        timestamp: session.endedAt,
        label: session.status === 'cancelled' ? 'Sessão de foco cancelada' : 'Sessão de foco terminada',
      })
    }
  }
  for (const coffee of coffees) {
    events.push({
      id: coffee.id,
      type: 'coffee',
      recordType: 'coffee',
      recordId: coffee.id,
      deletable: true,
      timestamp: coffee.createdAt,
      label: coffee.quantity === 1 ? 'Café adicionado' : `${coffee.quantity} cafés adicionados`,
      detail: `${coffee.totalPrice.toFixed(2)} €`,
    })
  }

  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return {
    date,
    journeys,
    breaks,
    activities,
    focusSessions,
    coffees,
    events,
    summary: {
      journeyMs,
      effectiveMs,
      breakMs,
      focusMs,
      activityCount: activities.filter((activity) => activity.status === 'completed').length,
      coffeeCount,
      coffeeCost,
    },
  }
}
