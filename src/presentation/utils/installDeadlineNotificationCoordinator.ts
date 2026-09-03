import { secureStorage } from '../../security/secureStorage'
import type { BreakRepository } from '../../application/breaks/BreakRepository'
import type { FocusRepository } from '../../application/focus/FocusRepository'
import type { JourneyRepository } from '../../application/journey/JourneyRepository'
import type { MedicationDataProtectionService } from '../../application/personalStock/MedicationDataProtectionService'
import type { MedicationDoseStatusService } from '../../application/personalStock/MedicationDoseStatusService'
import { parseGloSessionTimerState } from '../../application/personalStock/GloSessionTimer'
import type { PersonalStockService } from '../../application/personalStock/PersonalStockService'
import { minorToDecimal } from '../../application/personalStock/decimal'
import { addCalendarDays, dateKeyInZone, resolveZonedLocalDateTime } from '../../application/personalStock/time'
import type { SettingsRepository } from '../../application/settings/SettingsRepository'
import { getScheduleMilestones, resolveWorkScheduleForDate, type ScheduleMilestone } from '../../domain/journey/WorkSchedule'
import type { MedicationDoseEvent } from '../../domain/personalStock/models'
import {
  deliverDueDeadlines,
  nextPendingDeadlineAt,
  type DeadlineNotification,
} from '../../shared/notifications/deadlineNotifications'

const GLO_SESSION_TIMER_STORAGE_KEY = 'foco-jornada:glo-session-timer-v2'
const LEGACY_GLO_SESSION_TIMER_STORAGE_KEY = 'foco-jornada:glo-session-timer-v1'
const PORTUGAL_TIMEZONE = 'Europe/Lisbon'
const PROVIDER_REFRESH_MS = 15_000
const MAX_WAKE_DELAY_MS = 60_000
const MEDICATION_RECONCILIATION_WINDOW_MS = 48 * 60 * 60 * 1000
const SCHEDULE_PAST_GRACE_MS = 15 * 60 * 1000
const SCHEDULE_LOOKAHEAD_MS = 30 * 60 * 60 * 1000

interface DeadlineCoordinatorServices {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  focusRepository: FocusRepository
  settingsRepository: SettingsRepository
  personalStockService: PersonalStockService
  medicationDoseStatusService: MedicationDoseStatusService
  medicationDataProtectionService: MedicationDataProtectionService
}

function focusDeadline(session: {
  id: string
  segmentType: string
  status: string
  startedAt: string
  plannedDurationSeconds: number
  totalPausedSeconds: number
}): DeadlineNotification | null {
  if (session.status !== 'running') return null
  const startedAtMs = Date.parse(session.startedAt)
  if (!Number.isFinite(startedAtMs)) return null
  const durationMs = (session.plannedDurationSeconds + session.totalPausedSeconds) * 1000
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null
  const deadlineAt = new Date(startedAtMs + durationMs).toISOString()
  const isBreak = session.segmentType === 'short-break' || session.segmentType === 'long-break'
  return {
    id: `focus:${session.id}:${deadlineAt}`,
    deadlineAt,
    title: isBreak ? 'Pausa Pomodoro concluída' : 'Pomodoro concluído',
    detail: isBreak
      ? 'O tempo programado da pausa terminou.'
      : 'O tempo programado da sessão de foco terminou.',
    tone: 'success',
    tag: `focus-${session.id}`,
    category: 'focus',
    url: '#/foco',
  }
}

function breakDeadline(record: {
  id: string
  startedAt: string
  plannedDurationMinutes?: number
  status: string
}): DeadlineNotification | null {
  if (record.status !== 'active' || !record.plannedDurationMinutes) return null
  const startedAtMs = Date.parse(record.startedAt)
  if (!Number.isFinite(startedAtMs)) return null
  const deadlineAt = new Date(startedAtMs + record.plannedDurationMinutes * 60_000).toISOString()
  return {
    id: `break:${record.id}:${deadlineAt}`,
    deadlineAt,
    title: 'Tempo da pausa concluído',
    detail: 'A duração planeada da pausa terminou. A pausa continua aberta até ser terminada na aplicação.',
    tone: 'info',
    tag: `break-${record.id}`,
    category: 'break',
    url: '#/',
  }
}

function gloDeadline(): DeadlineNotification | null {
  try {
    const raw = secureStorage.getItem(GLO_SESSION_TIMER_STORAGE_KEY)
      ?? secureStorage.getItem(LEGACY_GLO_SESSION_TIMER_STORAGE_KEY)
    const state = parseGloSessionTimerState(raw)
    if (!state.session) return null
    return {
      id: `glo:${state.session.startedAt}:${state.session.endsAt}`,
      deadlineAt: state.session.endsAt,
      title: 'Sessão glo concluída',
      detail: `${state.session.deviceLabel} · ${state.session.modeLabel}: o tempo técnico configurado da sessão terminou.`,
      tone: 'success',
      tag: `glo-${state.session.startedAt}`,
      category: 'glo',
      url: '#/sticks',
    }
  } catch {
    return null
  }
}

function activeEventByOccurrence(events: MedicationDoseEvent[]): Map<string, MedicationDoseEvent> {
  const correctedIds = new Set(
    events
      .filter((event) => event.status === 'corrected' && event.correctionOf)
      .map((event) => event.correctionOf as string),
  )
  const map = new Map<string, MedicationDoseEvent>()
  for (const event of events) {
    if (event.status === 'corrected' || correctedIds.has(event.id)) continue
    const current = map.get(event.occurrenceKey)
    if (!current || current.createdAt < event.createdAt || (current.createdAt === event.createdAt && current.id < event.id)) {
      map.set(event.occurrenceKey, event)
    }
  }
  return map
}

async function medicationDeadlines(
  services: DeadlineCoordinatorServices,
  now: Date,
): Promise<DeadlineNotification[]> {
  const medications = await services.personalStockService.listMedications()
  const candidates: DeadlineNotification[] = []
  const nowMs = now.getTime()

  await Promise.all(medications.map(async (medication) => {
    try {
      const profile = await services.medicationDataProtectionService.getProfile(medication.medication.id)
      if (profile.status !== 'active') return

      const events = await services.personalStockService.listDoseEvents(medication.medication.id)
      const activeEvents = activeEventByOccurrence(events)
      const today = dateKeyInZone(now, medication.medication.timezone)
      const dates = [addCalendarDays(today, -1), today, addCalendarDays(today, 1)]
      const name = `${medication.medication.name} ${medication.medication.dosage ?? ''}`.trim()

      for (const onDate of dates) {
        const schedules = await services.personalStockService.schedulesForDate(medication.medication.id, onDate)
        for (const schedule of schedules) {
          const occurrenceKey = `${schedule.id}:${onDate}`
          const event = activeEvents.get(occurrenceKey)
          if (event?.status === 'taken' || event?.status === 'not_taken') continue

          let deadlineAt: string
          let quantityMinor = schedule.quantityMinor
          if (event?.status === 'postponed') {
            if (!event.postponedTo) continue
            deadlineAt = event.postponedTo
            quantityMinor = event.quantityMinor
          } else {
            deadlineAt = resolveZonedLocalDateTime(
              onDate,
              schedule.localTime,
              medication.medication.timezone,
              schedule.fold,
            ).toISOString()
          }

          const deadlineMs = Date.parse(deadlineAt)
          if (!Number.isFinite(deadlineMs)) continue
          if (deadlineMs < nowMs - MEDICATION_RECONCILIATION_WINDOW_MS) continue
          if (deadlineMs > nowMs + MEDICATION_RECONCILIATION_WINDOW_MS) continue

          candidates.push({
            id: `medication:${medication.medication.id}:${occurrenceKey}:${deadlineAt}`,
            deadlineAt,
            title: 'Hora programada da medicação atingida',
            detail: `${name}: chegou o horário registado (${minorToDecimal(quantityMinor)} ${medication.medication.unit}). Confirma o estado da toma na aplicação. Este aviso não cria nem altera a prescrição.`,
            tone: 'info',
            tag: `medication-${medication.medication.id}-${occurrenceKey}`,
            category: 'medication',
            url: '#/medicamentos',
          })
        }
      }
    } catch {
      // Sem dados suficientes: não é criada uma hora alternativa por suposição.
    }
  }))

  return candidates
    .sort((left, right) => Date.parse(left.deadlineAt) - Date.parse(right.deadlineAt))
    .slice(0, 24)
}

function scheduleMilestoneCopy(
  milestone: ScheduleMilestone,
  hasActiveJourney: boolean,
): Pick<DeadlineNotification, 'title' | 'detail' | 'category'> {
  if (milestone.kind === 'entry') {
    return {
      title: 'Hora de entrada planeada',
      detail: `O horário configurado começa às ${milestone.time}. Regista a entrada quando iniciares a jornada.`,
      category: 'journey',
    }
  }

  if (milestone.kind === 'break-start') {
    return {
      title: 'Pausa planeada',
      detail: `Chegou a hora planeada da pausa (${milestone.time}). O registo real da pausa continua a depender da tua ação na aplicação.`,
      category: 'break',
    }
  }

  if (milestone.kind === 'break-end') {
    return {
      title: 'Regresso planeado',
      detail: `O horário configurado prevê o regresso às ${milestone.time}. Confirma o estado real da pausa na aplicação.`,
      category: 'break',
    }
  }

  return {
    title: 'Hora de saída planeada',
    detail: hasActiveJourney
      ? `O horário configurado terminou às ${milestone.time}. A jornada continua aberta até registares a saída.`
      : `O horário de trabalho configurado para hoje termina às ${milestone.time}.`,
    category: 'journey',
  }
}

async function workScheduleDeadlines(
  services: DeadlineCoordinatorServices,
  now: Date,
): Promise<DeadlineNotification[]> {
  const [settings, activeJourney] = await Promise.all([
    services.settingsRepository.get(),
    services.journeyRepository.getActive(),
  ])
  const today = dateKeyInZone(now, PORTUGAL_TIMEZONE)
  const dates = [today, addCalendarDays(today, 1)]
  const nowMs = now.getTime()
  const candidates: DeadlineNotification[] = []

  for (const onDate of dates) {
    const resolved = resolveWorkScheduleForDate(settings.workSchedule, onDate)
    if (!resolved.isWorkingDay) continue

    for (const milestone of getScheduleMilestones(settings.workSchedule, onDate)) {
      try {
        const deadline = resolveZonedLocalDateTime(onDate, milestone.time, PORTUGAL_TIMEZONE)
        const deadlineMs = deadline.getTime()
        if (deadlineMs < nowMs - SCHEDULE_PAST_GRACE_MS) continue
        if (deadlineMs > nowMs + SCHEDULE_LOOKAHEAD_MS) continue

        const copy = scheduleMilestoneCopy(milestone, Boolean(activeJourney))
        candidates.push({
          id: `schedule:${onDate}:${milestone.id}:${deadline.toISOString()}`,
          deadlineAt: deadline.toISOString(),
          title: copy.title,
          detail: copy.detail,
          tone: 'info',
          tag: `schedule-${onDate}-${milestone.id}`,
          category: copy.category,
          url: '#/',
        })
      } catch {
        // Um horário inválido não é substituído por uma estimativa.
      }
    }
  }

  return candidates.sort((left, right) => Date.parse(left.deadlineAt) - Date.parse(right.deadlineAt))
}

async function collectDeadlines(
  services: DeadlineCoordinatorServices,
  now = new Date(),
): Promise<DeadlineNotification[]> {
  const deadlines: DeadlineNotification[] = []
  const activeJourney = await services.journeyRepository.getActive()

  if (activeJourney) {
    const [focus, activeBreak] = await Promise.all([
      services.focusRepository.getOpenForJourney(activeJourney.id),
      services.breakRepository.getActiveForJourney(activeJourney.id),
    ])
    const focusItem = focus ? focusDeadline(focus) : null
    const breakItem = activeBreak ? breakDeadline(activeBreak) : null
    if (focusItem) deadlines.push(focusItem)
    if (breakItem) deadlines.push(breakItem)
  }

  const [medication, schedule] = await Promise.all([
    medicationDeadlines(services, now),
    workScheduleDeadlines(services, now),
  ])
  deadlines.push(...medication, ...schedule)

  const glo = gloDeadline()
  if (glo) deadlines.push(glo)

  return deadlines
}

export function installDeadlineNotificationCoordinator(services: DeadlineCoordinatorServices): () => void {
  let deadlines: DeadlineNotification[] = []
  let refreshTimer: number | null = null
  let wakeTimer: number | null = null
  let clickTimer: number | null = null
  let refreshing = false
  let stopped = false

  const scheduleWake = () => {
    if (wakeTimer !== null) window.clearTimeout(wakeTimer)
    const nextAt = nextPendingDeadlineAt(deadlines)
    const nowMs = Date.now()
    const delay = nextAt
      ? Math.max(25, Math.min(MAX_WAKE_DELAY_MS, Date.parse(nextAt) - nowMs))
      : MAX_WAKE_DELAY_MS
    wakeTimer = window.setTimeout(() => {
      void evaluate()
    }, delay)
  }

  const evaluate = async () => {
    if (stopped) return
    await deliverDueDeadlines(deadlines, new Date())
    scheduleWake()
  }

  const refresh = async () => {
    if (stopped || refreshing) return
    refreshing = true
    try {
      deadlines = await collectDeadlines(services, new Date())
      await deliverDueDeadlines(deadlines, new Date())
      scheduleWake()
    } catch {
      // Uma falha de um provider nunca deve bloquear a aplicação ou inventar deadlines alternativos.
    } finally {
      refreshing = false
    }
  }

  const syncNow = () => void refresh()
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') syncNow()
  }
  const handleDocumentClick = () => {
    if (clickTimer !== null) window.clearTimeout(clickTimer)
    clickTimer = window.setTimeout(syncNow, 350)
  }

  void refresh()
  refreshTimer = window.setInterval(syncNow, PROVIDER_REFRESH_MS)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', syncNow)
  window.addEventListener('pageshow', syncNow)
  window.addEventListener('storage', syncNow)
  document.addEventListener('click', handleDocumentClick, true)

  window.addEventListener('beforeunload', () => {
    stopped = true
    if (refreshTimer !== null) window.clearInterval(refreshTimer)
    if (wakeTimer !== null) window.clearTimeout(wakeTimer)
    if (clickTimer !== null) window.clearTimeout(clickTimer)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', syncNow)
    window.removeEventListener('pageshow', syncNow)
    window.removeEventListener('storage', syncNow)
    document.removeEventListener('click', handleDocumentClick, true)
  }, { once: true })
}
