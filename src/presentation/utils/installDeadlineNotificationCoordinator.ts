import type { BreakRepository } from '../../application/breaks/BreakRepository'
import type { FocusRepository } from '../../application/focus/FocusRepository'
import type { JourneyRepository } from '../../application/journey/JourneyRepository'
import type { MedicationDataProtectionService } from '../../application/personalStock/MedicationDataProtectionService'
import type { MedicationDoseStatusService } from '../../application/personalStock/MedicationDoseStatusService'
import { parseGloSessionTimerState } from '../../application/personalStock/GloSessionTimer'
import { resolveLastActiveTakenEvent } from '../../application/personalStock/MedicationNextDoseTimer'
import type { PersonalStockService } from '../../application/personalStock/PersonalStockService'
import { resolveZonedLocalDateTime } from '../../application/personalStock/time'
import type { SettingsRepository } from '../../application/settings/SettingsRepository'
import { resolveWorkScheduleForDate } from '../../domain/journey/WorkSchedule'
import {
  deliverDueDeadlines,
  nextPendingDeadlineAt,
  type DeadlineNotification,
} from '../../shared/notifications/deadlineNotifications'

const GLO_SESSION_TIMER_STORAGE_KEY = 'foco-jornada:glo-session-timer-v2'
const LEGACY_GLO_SESSION_TIMER_STORAGE_KEY = 'foco-jornada:glo-session-timer-v1'
const PORTUGAL_TIMEZONE = 'Europe/Lisbon'
const PROVIDER_REFRESH_MS = 5_000
const MAX_WAKE_DELAY_MS = 60_000

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
  mode: string
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
  }
}

function gloDeadline(): DeadlineNotification | null {
  try {
    const raw = window.localStorage.getItem(GLO_SESSION_TIMER_STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_GLO_SESSION_TIMER_STORAGE_KEY)
    const state = parseGloSessionTimerState(raw)
    if (!state.session) return null
    return {
      id: `glo:${state.session.startedAt}:${state.session.endsAt}`,
      deadlineAt: state.session.endsAt,
      title: 'Sessão glo concluída',
      detail: `${state.session.deviceLabel} · ${state.session.modeLabel}: o tempo técnico configurado da sessão terminou.`,
      tone: 'success',
      tag: `glo-${state.session.startedAt}`,
    }
  } catch {
    return null
  }
}

async function medicationDeadline(services: DeadlineCoordinatorServices, now: Date): Promise<DeadlineNotification | null> {
  const medications = await services.personalStockService.listMedications()
  const candidates: DeadlineNotification[] = []

  await Promise.all(medications.map(async (medication) => {
    try {
      const profile = await services.medicationDataProtectionService.getProfile(medication.medication.id)
      if (profile.status !== 'active') return
      const [forecast, events] = await Promise.all([
        services.medicationDoseStatusService.forecastMedication(medication.medication.id, now),
        services.personalStockService.listDoseEvents(medication.medication.id),
      ])
      const lastTaken = resolveLastActiveTakenEvent(events)
      const deadlineAt = forecast.nextDose.scheduledAt
      if (!Number.isFinite(Date.parse(deadlineAt))) return
      const name = `${medication.medication.name} ${medication.medication.dosage ?? ''}`.trim()
      candidates.push({
        id: `medication:${medication.medication.id}:${deadlineAt}`,
        deadlineAt,
        title: 'Hora programada da medicação atingida',
        detail: `${name}: chegou o horário registado (${forecast.nextDose.quantity} ${medication.medication.unit}). Confirma a toma na aplicação. Este aviso não cria nem altera a prescrição.${lastTaken ? '' : ' Não existe confirmação anterior registada.'}`,
        tone: 'info',
        tag: `medication-${medication.medication.id}`,
      })
    } catch {
      // Sem dados suficientes ou com adiamento por confirmar: não é criada uma hora por suposição.
    }
  }))

  candidates.sort((left, right) => Date.parse(left.deadlineAt) - Date.parse(right.deadlineAt))
  return candidates[0] ?? null
}

async function workScheduleDeadline(services: DeadlineCoordinatorServices, now: Date): Promise<DeadlineNotification | null> {
  const activeJourney = await services.journeyRepository.getActive()
  if (!activeJourney) return null
  const settings = await services.settingsRepository.get()
  const resolved = resolveWorkScheduleForDate(settings.workSchedule, now)
  if (!resolved.isWorkingDay) return null

  try {
    const deadline = resolveZonedLocalDateTime(resolved.dateKey, resolved.endTime, PORTUGAL_TIMEZONE)
    return {
      id: `work-schedule:${activeJourney.id}:${deadline.toISOString()}`,
      deadlineAt: deadline.toISOString(),
      title: 'Horário de trabalho planeado concluído',
      detail: `O horário configurado para hoje terminou às ${resolved.endTime}. A jornada só é encerrada quando registares a saída.`,
      tone: 'info',
      tag: `work-schedule-${activeJourney.id}`,
    }
  } catch {
    return null
  }
}

async function collectDeadlines(services: DeadlineCoordinatorServices, now = new Date()): Promise<DeadlineNotification[]> {
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
    medicationDeadline(services, now),
    workScheduleDeadline(services, now),
  ])
  if (medication) deadlines.push(medication)
  if (schedule) deadlines.push(schedule)

  const glo = gloDeadline()
  if (glo) deadlines.push(glo)

  return deadlines
}

export function installDeadlineNotificationCoordinator(services: DeadlineCoordinatorServices): void {
  let deadlines: DeadlineNotification[] = []
  let refreshTimer: number | null = null
  let wakeTimer: number | null = null
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

  void refresh()
  refreshTimer = window.setInterval(syncNow, PROVIDER_REFRESH_MS)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', syncNow)
  window.addEventListener('pageshow', syncNow)
  window.addEventListener('storage', syncNow)
  document.addEventListener('click', () => window.setTimeout(syncNow, 350), true)

  window.addEventListener('beforeunload', () => {
    stopped = true
    if (refreshTimer !== null) window.clearInterval(refreshTimer)
    if (wakeTimer !== null) window.clearTimeout(wakeTimer)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', syncNow)
    window.removeEventListener('pageshow', syncNow)
    window.removeEventListener('storage', syncNow)
  }, { once: true })
}
