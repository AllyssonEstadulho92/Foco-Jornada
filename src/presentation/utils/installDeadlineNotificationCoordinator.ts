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
import { resolveWorkScheduleForDate } from '../../domain/journey/WorkSchedule'
import type { MedicationDoseEvent } from '../../domain/personalStock/models'
import {
  deliverDueDeadlines,
  getDeadlineNotificationPermission,
  nextPendingDeadlineAt,
  requestDeadlineNotificationPermission,
  subscribeDeadlineNotificationPermission,
  type DeadlineNotification,
} from '../../shared/notifications/deadlineNotifications'

const GLO_SESSION_TIMER_STORAGE_KEY = 'foco-jornada:glo-session-timer-v2'
const LEGACY_GLO_SESSION_TIMER_STORAGE_KEY = 'foco-jornada:glo-session-timer-v1'
const PORTUGAL_TIMEZONE = 'Europe/Lisbon'
const PROVIDER_REFRESH_MS = 5_000
const MAX_WAKE_DELAY_MS = 60_000
const MEDICATION_RECONCILIATION_WINDOW_MS = 48 * 60 * 60 * 1000
const PERMISSION_CONTROL_ID = 'deadline-mobile-notification-permission'

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

async function workScheduleDeadline(
  services: DeadlineCoordinatorServices,
  now: Date,
): Promise<DeadlineNotification | null> {
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
    workScheduleDeadline(services, now),
  ])
  deadlines.push(...medication)
  if (schedule) deadlines.push(schedule)

  const glo = gloDeadline()
  if (glo) deadlines.push(glo)

  return deadlines
}

function renderPermissionControl(): void {
  const panel = document.querySelector<HTMLElement>('.notificationPanel')
  if (!panel) return

  let control = document.getElementById(PERMISSION_CONTROL_ID)
  if (!control) {
    control = document.createElement('section')
    control.id = PERMISSION_CONTROL_ID
    control.setAttribute('aria-label', 'Notificações do telemóvel')
    control.style.cssText = [
      'margin:10px',
      'padding:11px 12px',
      'border:1px solid var(--line)',
      'border-radius:12px',
      'background:var(--surface-2)',
      'display:grid',
      'gap:8px',
    ].join(';')
    const footer = panel.querySelector('.notificationPanelFooter')
    if (footer) footer.insertAdjacentElement('beforebegin', control)
    else panel.appendChild(control)
  }

  const permission = getDeadlineNotificationPermission()
  const title = permission === 'granted'
    ? 'Notificações do telemóvel ativas'
    : permission === 'denied'
      ? 'Notificações bloqueadas no browser'
      : permission === 'unsupported'
        ? 'Notificações do sistema indisponíveis'
        : 'Ativar notificações do telemóvel'
  const detail = permission === 'granted'
    ? 'Quando um deadline terminar e o browser permitir execução, o aviso também é enviado pelo sistema.'
    : permission === 'denied'
      ? 'Ativa a permissão nas definições do browser ou da aplicação instalada.'
      : permission === 'unsupported'
        ? 'Os avisos continuam guardados no centro de notificações da aplicação.'
        : 'Autoriza uma vez para receber no sistema os avisos de medicação, Pomodoro, pausas, sessão glo e horário de trabalho.'

  control.innerHTML = ''
  const strong = document.createElement('strong')
  strong.textContent = title
  strong.style.cssText = 'font-size:12px;color:var(--text)'
  const small = document.createElement('small')
  small.textContent = detail
  small.style.cssText = 'font-size:10px;line-height:1.45;color:var(--muted)'
  control.append(strong, small)

  if (permission === 'default') {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Ativar notificações'
    button.style.cssText = [
      'min-height:38px',
      'border:1px solid color-mix(in srgb,var(--primary) 28%,var(--line))',
      'border-radius:10px',
      'background:var(--primary-soft)',
      'color:var(--primary)',
      'font:inherit',
      'font-size:11px',
      'font-weight:800',
      'cursor:pointer',
    ].join(';')
    button.addEventListener('click', () => {
      button.disabled = true
      void requestDeadlineNotificationPermission().finally(() => renderPermissionControl())
    })
    control.appendChild(button)
  }
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
      renderPermissionControl()
    }
  }

  const syncNow = () => void refresh()
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') syncNow()
  }

  void refresh()
  renderPermissionControl()
  refreshTimer = window.setInterval(syncNow, PROVIDER_REFRESH_MS)
  const unsubscribePermission = subscribeDeadlineNotificationPermission(() => renderPermissionControl())
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', syncNow)
  window.addEventListener('pageshow', syncNow)
  window.addEventListener('storage', syncNow)
  document.addEventListener('click', () => window.setTimeout(syncNow, 350), true)

  window.addEventListener('beforeunload', () => {
    stopped = true
    if (refreshTimer !== null) window.clearInterval(refreshTimer)
    if (wakeTimer !== null) window.clearTimeout(wakeTimer)
    unsubscribePermission()
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', syncNow)
    window.removeEventListener('pageshow', syncNow)
    window.removeEventListener('storage', syncNow)
  }, { once: true })
}
