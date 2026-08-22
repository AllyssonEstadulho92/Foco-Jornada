import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEffectiveJourneyDurationMs } from '../../application/journey/getEffectiveJourneyDuration'
import { getActivityDurationMs } from '../../domain/activities/Activity'
import { getBreakDurationMs } from '../../domain/breaks/BreakRecord'
import { getFocusElapsedMs, getFocusRemainingMs } from '../../domain/focus/FocusSession'
import { getJourneyDurationMs } from '../../domain/journey/Journey'
import {
  formatPlannedMinutes,
  getNextScheduleEvent,
  getScheduleSummary,
  parseClockMinutes,
  resolveWorkScheduleForDate,
} from '../../domain/journey/WorkSchedule'
import { pushAppNotification } from '../store/useNotificationStore'
import { formatClockTime, formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { getTimeGreeting } from '../../shared/utils/timeGreeting'
import { useActivityController } from '../hooks/useActivityController'
import { useBreakController } from '../hooks/useBreakController'
import { useCoffeeController } from '../hooks/useCoffeeController'
import { useDayReport } from '../hooks/useDayReport'
import { useFocusController } from '../hooks/useFocusController'
import { useJourneyController } from '../hooks/useJourneyController'
import { useNow } from '../hooks/useNow'
import { useSettingsController } from '../hooks/useSettingsController'

const notifiedBreaks = new Set<string>()

function FocusGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  )
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  )
}

function formatFocusTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function TodayReferencePage() {
  const { activeJourney, isLoading, isBusy, error, start, finish } = useJourneyController()
  const {
    activeBreak,
    breaks,
    isBusy: isBreakBusy,
    error: breakError,
    start: startBreak,
    finish: finishBreak,
  } = useBreakController(activeJourney?.id)
  const {
    activeActivity,
    error: activityError,
    complete: completeActivity,
  } = useActivityController(activeJourney?.id)
  const {
    sessions: focusSessions,
    activeSession: activeFocus,
    isBusy: isFocusBusy,
    error: focusError,
    startPomodoro,
    pause: pauseFocus,
    resume: resumeFocus,
    complete: completeFocus,
  } = useFocusController(activeJourney?.id)
  const { isBusy: isCoffeeBusy, error: coffeeError, add: addCoffee } = useCoffeeController()
  const { settings, save: saveSettings, isBusy: isSettingsBusy, error: settingsError } = useSettingsController()
  const now = useNow()
  const nowIso = now.toISOString()
  const todayKey = toLocalDateKey(now)
  const { report, refresh: refreshReport } = useDayReport(todayKey)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualStartTime, setManualStartTime] = useState('')
  const [manualEndTime, setManualEndTime] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)

  const schedule = settings.workSchedule
  const resolvedSchedule = resolveWorkScheduleForDate(schedule, now)
  const scheduleSummary = getScheduleSummary(schedule, now)
  const nextScheduleEvent = getNextScheduleEvent(schedule, now)

  const dayJourneys = report?.journeys ?? (activeJourney ? [activeJourney] : [])
  const dayBreaks = report?.breaks ?? breaks
  const dayFocusSessions = report?.focusSessions ?? focusSessions

  const journeyDurationMs = useMemo(
    () => dayJourneys.reduce((sum, journey) => sum + getJourneyDurationMs(journey, journey.endedAt ?? nowIso), 0),
    [dayJourneys, nowIso],
  )
  const breakDurationMs = useMemo(
    () => dayBreaks
      .filter((item) => item.status !== 'cancelled')
      .reduce((sum, item) => sum + getBreakDurationMs(item, item.endedAt ?? nowIso), 0),
    [dayBreaks, nowIso],
  )
  const effectiveDurationMs = useMemo(
    () => dayJourneys.reduce((sum, journey) => {
      const journeyBreaks = dayBreaks.filter((item) => item.journeyId === journey.id)
      return sum + getEffectiveJourneyDurationMs(journey, journeyBreaks, journey.endedAt ?? nowIso)
    }, 0),
    [dayBreaks, dayJourneys, nowIso],
  )

  const activeBreakDurationMs = activeBreak ? getBreakDurationMs(activeBreak, nowIso) : 0
  const activeBreakPlannedMs = activeBreak?.plannedDurationMinutes
    ? activeBreak.plannedDurationMinutes * 60 * 1000
    : 0
  const breakReachedPlan = Boolean(
    activeBreak && activeBreakPlannedMs > 0 && activeBreakDurationMs >= activeBreakPlannedMs,
  )
  const activeActivityDurationMs = activeActivity ? getActivityDurationMs(activeActivity, nowIso) : 0
  const completedFocusCount = dayFocusSessions.filter(
    (item) => item.segmentType === 'focus' && item.status === 'completed',
  ).length
  const completedActivityCount = report?.summary.activityCount ?? 0

  const focusRemainingMs = activeFocus ? getFocusRemainingMs(activeFocus, nowIso) : 0
  const focusProgress = activeFocus
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (getFocusElapsedMs(activeFocus, nowIso) / (activeFocus.plannedDurationSeconds * 1000)) * 100,
          ),
        ),
      )
    : 0
  const breakProgress = activeBreak && activeBreakPlannedMs > 0
    ? Math.min(100, Math.round((activeBreakDurationMs / activeBreakPlannedMs) * 100))
    : 0
  const mainProgress = activeBreak ? breakProgress : activeFocus ? focusProgress : 0

  const mainTitle = activeBreak
    ? 'Pausa em curso'
    : activeFocus
      ? 'Foco atual'
      : activeActivity
        ? 'Atividade em curso'
        : activeJourney
          ? 'Jornada ativa'
          : 'Pronto para começar'
  const mainSubtitle = activeBreak
    ? activeBreak.plannedDurationMinutes
      ? `Pausa planeada · ${activeBreak.plannedDurationMinutes} min`
      : 'Pausa sem duração definida'
    : activeFocus
      ? activeActivity?.name ?? 'Trabalho profundo'
      : activeActivity
        ? activeActivity.name
        : activeJourney
          ? resolvedSchedule.isWorkingDay
            ? `${resolvedSchedule.startTime}–${resolvedSchedule.endTime}`
            : 'Jornada sem horário planeado'
          : resolvedSchedule.isWorkingDay
            ? `${resolvedSchedule.startTime}–${resolvedSchedule.endTime}`
            : 'Dia sem jornada planeada'
  const mainTime = activeBreak
    ? formatDuration(activeBreakDurationMs)
    : activeFocus
      ? formatFocusTime(focusRemainingMs)
      : activeActivity
        ? formatDuration(activeActivityDurationMs)
        : activeJourney
          ? formatDuration(effectiveDurationMs)
          : nextScheduleEvent.time ?? '—'
  const mainTimeLabel = activeBreak
    ? 'Tempo da pausa'
    : activeFocus
      ? 'Tempo restante'
      : activeActivity
        ? 'Tempo da atividade'
        : activeJourney
          ? 'Tempo efetivo'
          : nextScheduleEvent.label
  const primaryActionLabel = activeBreak
    ? 'Terminar pausa'
    : activeFocus?.status === 'paused'
      ? 'Retomar foco'
      : activeFocus
        ? 'Pausar foco'
        : activeActivity
          ? 'Concluir atividade'
          : activeJourney
            ? 'Iniciar foco'
            : 'Iniciar jornada'
  const primaryActionGlyph = activeBreak
    ? '▶'
    : activeFocus?.status === 'paused'
      ? '▶'
      : activeFocus
        ? 'Ⅱ'
        : activeActivity
          ? '✓'
          : '▶'

  const dateLabel = new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)
  const greeting = getTimeGreeting(now)

  const pageError = error ?? breakError ?? activityError ?? focusError ?? coffeeError ?? settingsError

  useEffect(() => {
    if (
      activeFocus?.status === 'running' &&
      focusRemainingMs === 0 &&
      !activeBreak &&
      !isFocusBusy
    ) {
      void completeFocus().then(() => refreshReport())
    }
  }, [activeBreak, activeFocus?.status, completeFocus, focusRemainingMs, isFocusBusy, refreshReport])

  useEffect(() => {
    if (!activeBreak || !breakReachedPlan || notifiedBreaks.has(activeBreak.id)) return

    notifiedBreaks.add(activeBreak.id)
    pushAppNotification(
      'info',
      'Tempo da pausa concluído.',
      'A pausa continua a contar até tocares em “Terminar pausa”.',
    )
  }, [activeBreak, breakReachedPlan])

  async function handleStartJourney() {
    await start()
    await refreshReport()
  }

  async function handleFinishJourney() {
    if (!window.confirm('Terminar a jornada atual? Os registos em curso serão encerrados de forma consistente.')) return
    await finish()
    await refreshReport()
  }

  async function handleStartBreak() {
    if (activeFocus?.status === 'running') {
      await pauseFocus()
    }
    await startBreak('short', 15)
    await refreshReport()
  }

  async function handleFinishBreak() {
    await finishBreak()
    await refreshReport()
  }

  async function handleCompleteActivity() {
    if (!activeActivity) return
    await completeActivity(activeActivity.id)
    await refreshReport()
  }

  async function handleAddCoffee() {
    await addCoffee(1)
    await refreshReport()
  }

  async function handlePrimaryAction() {
    if (activeBreak) {
      await handleFinishBreak()
      return
    }
    if (activeFocus) {
      if (activeFocus.status === 'paused') await resumeFocus()
      else await pauseFocus()
      await refreshReport()
      return
    }
    if (activeActivity) {
      await handleCompleteActivity()
      return
    }
    if (activeJourney) {
      await startPomodoro(undefined, activeActivity?.id)
      await refreshReport()
      return
    }
    await handleStartJourney()
  }

  function openManualSchedule() {
    setManualStartTime(resolvedSchedule.startTime)
    setManualEndTime(resolvedSchedule.endTime)
    setManualError(null)
    setManualOpen(true)
  }

  async function saveManualSchedule() {
    const startMinutes = parseClockMinutes(manualStartTime)
    const endMinutes = parseClockMinutes(manualEndTime)
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      setManualError('Indica uma entrada e uma saída válidas. A saída tem de ser posterior à entrada.')
      return
    }

    await saveSettings({
      ...settings,
      workSchedule: {
        ...schedule,
        dayOverrides: [
          ...schedule.dayOverrides.filter((item) => item.date !== todayKey),
          { date: todayKey, startTime: manualStartTime, endTime: manualEndTime },
        ],
      },
    })
    setManualOpen(false)
    setManualError(null)
  }

  async function resetManualSchedule() {
    await saveSettings({
      ...settings,
      workSchedule: {
        ...schedule,
        dayOverrides: schedule.dayOverrides.filter((item) => item.date !== todayKey),
      },
    })
    setManualOpen(false)
    setManualError(null)
  }

  const busy = isBusy || isBreakBusy || isFocusBusy || isCoffeeBusy || isSettingsBusy || isLoading

  return (
    <section className="referenceHome" aria-labelledby="reference-home-title">
      <h1 id="reference-home-title" className="referenceVisuallyHidden">Hoje</h1>

      <header className="referenceGreeting">
        <div>
          <span>{dateLabel}</span>
          <h2>{greeting}, foco! <i aria-hidden="true">✦</i></h2>
          <p>Que tal manter o ritmo e fazer mais acontecer hoje?</p>
        </div>
        <div className="referencePlant" aria-hidden="true">
          <span className="referencePlantGlow" />
          <span className="referenceLeaf referenceLeafLeft" />
          <span className="referenceLeaf referenceLeafRight" />
          <span className="referenceStem" />
        </div>
      </header>

      {pageError ? <div className="errorBanner" role="alert">{pageError}</div> : null}

      <section className="referenceFocusCard" aria-labelledby="reference-focus-title">
        <div className="referenceFocusHeader">
          <span className="referenceRoundIcon"><FocusGlyph /></span>
          <div>
            <h2 id="reference-focus-title">{mainTitle}</h2>
            <p>{mainSubtitle}</p>
          </div>
          <details className="referenceMoreMenu">
            <summary aria-label="Mais ações">•••</summary>
            <div>
              <Link to="/foco">Abrir Foco</Link>
              <Link to="/atividades">Atividades</Link>
              <button type="button" onClick={openManualSchedule}>Horário de hoje</button>
              {activeJourney ? <button type="button" onClick={() => void handleFinishJourney()}>Terminar jornada</button> : null}
            </div>
          </details>
        </div>

        <div className="referenceFocusBody">
          <div>
            <strong>{mainTime}</strong>
            <span>{mainTimeLabel}</span>
          </div>
          <div className="referenceProgressControl">
            <button
              type="button"
              className="referenceProgressAction"
              style={{ '--focus-progress': `${mainProgress * 3.6}deg` } as React.CSSProperties}
              onClick={() => void handlePrimaryAction()}
              disabled={busy}
              aria-label={primaryActionLabel}
            >
              <span>{primaryActionGlyph}</span>
            </button>
            <small>{primaryActionLabel}</small>
          </div>
        </div>

        <div className="referenceEncouragement">
          <span aria-hidden="true">⌁</span>
          <p>
            {activeBreak
              ? breakReachedPlan
                ? 'O tempo planeado terminou. A pausa continua a ser contada até terminares o registo.'
                : 'Pausa em curso. O tempo está a ser contado em tempo real.'
              : activeFocus
                ? activeFocus.status === 'paused'
                  ? 'O foco está pausado. Retoma quando estiveres pronto.'
                  : 'Mantém o foco, estás a avançar bem.'
                : activeActivity
                  ? 'Atividade em curso. Conclui-a quando terminares.'
                  : activeJourney
                    ? 'A jornada está a contar em tempo real.'
                    : 'Começa a jornada quando estiveres pronto.'}
          </p>
        </div>
      </section>

      <section className="referenceSummaryCard" aria-labelledby="reference-summary-title">
        <header>
          <div><span className="referenceSummaryGlyph" aria-hidden="true">▥</span><h2 id="reference-summary-title">Resumo do dia</h2></div>
          <Link to="/historico">Ver tudo <span aria-hidden="true">›</span></Link>
        </header>
        <div className="referenceSummaryGrid">
          <article>
            <strong>{formatDuration(journeyDurationMs)}</strong>
            <span>Jornada</span>
            <small>{activeJourney ? 'Em curso' : journeyDurationMs > 0 ? 'Acumulado hoje' : 'Sem registo'}</small>
          </article>
          <article>
            <strong>{formatDuration(breakDurationMs)}</strong>
            <span>Pausas</span>
            <small>{activeBreak ? 'A contar agora' : breakDurationMs > 0 ? 'Acumulado hoje' : 'Sem pausas'}</small>
          </article>
          <article>
            <strong>{formatDuration(effectiveDurationMs)}</strong>
            <span>Efetivo</span>
            <small>
              {completedActivityCount > 0 || completedFocusCount > 0
                ? `${completedActivityCount} ativ. · ${completedFocusCount} foco`
                : 'Tempo trabalhado'}
            </small>
          </article>
        </div>
      </section>

      <section className="referenceNextCard" aria-label="Próximo evento">
        <span className="referenceRoundIcon referenceCalendarIcon"><CalendarGlyph /></span>
        <div>
          <strong>Próximo evento</strong>
          <span>{nextScheduleEvent.label}</span>
          <small>{nextScheduleEvent.time ?? 'Sem evento pendente'}</small>
        </div>
        <Link to="/turnos">Ver agenda</Link>
      </section>

      <details className="referenceWorkPanel">
        <summary>
          <span>
            <strong>Jornada de trabalho</strong>
            <small>{resolvedSchedule.isWorkingDay ? `${resolvedSchedule.startTime}–${resolvedSchedule.endTime} · ${formatPlannedMinutes(scheduleSummary.effectiveMinutes)} efetivo` : 'Folga planeada'}</small>
          </span>
          <span aria-hidden="true">⌄</span>
        </summary>

        <div className="referenceWorkPanelBody">
          <div className="referenceWorkMetrics">
            <span><small>Entrada real</small><strong>{activeJourney ? formatClockTime(activeJourney.startedAt) : '—'}</strong></span>
            <span><small>Jornada</small><strong>{formatDuration(journeyDurationMs)}</strong></span>
            <span><small>Pausas</small><strong>{formatDuration(breakDurationMs)}</strong></span>
            <span><small>Efetivo</small><strong>{formatDuration(effectiveDurationMs)}</strong></span>
          </div>

          <h3>Ações rápidas</h3>
          <div className="referenceQuickActions">
            {!activeJourney ? (
              <button type="button" onClick={() => void handleStartJourney()} disabled={busy}>Iniciar jornada</button>
            ) : (
              <button type="button" onClick={() => void handleFinishJourney()} disabled={busy}>Terminar jornada</button>
            )}
            {activeJourney && !activeBreak ? (
              <button type="button" onClick={() => void handleStartBreak()} disabled={busy}>Pausa 15 min</button>
            ) : null}
            {activeBreak ? (
              <button type="button" onClick={() => void handleFinishBreak()} disabled={busy}>Terminar pausa</button>
            ) : null}
            {activeActivity && !activeBreak ? (
              <button type="button" onClick={() => void handleCompleteActivity()} disabled={busy}>Concluir atividade</button>
            ) : null}
            <Link to="/atividades">Atividades</Link>
            <Link to="/foco">Foco</Link>
            <button type="button" onClick={() => void handleAddCoffee()} disabled={busy}>Café +1 registo</button>
          </div>

          <button className="referenceInlineLink" type="button" onClick={openManualSchedule} disabled={isSettingsBusy}>
            {resolvedSchedule.source === 'manual' ? 'Alterar horário manual de hoje' : 'Definir horário manual de hoje'}
          </button>

          {manualOpen ? (
            <div className="referenceManualSchedule">
              <label><span>Entrada</span><input type="time" value={manualStartTime} onChange={(event) => setManualStartTime(event.target.value)} /></label>
              <label><span>Saída</span><input type="time" value={manualEndTime} onChange={(event) => setManualEndTime(event.target.value)} /></label>
              {manualError ? <div className="errorBanner" role="alert">{manualError}</div> : null}
              <div>
                <button type="button" onClick={() => setManualOpen(false)}>Cancelar</button>
                {resolvedSchedule.source === 'manual' ? <button type="button" onClick={() => void resetManualSchedule()}>Usar horário base</button> : null}
                <button type="button" className="referencePrimaryButton" onClick={() => void saveManualSchedule()}>Guardar horário de hoje</button>
              </div>
            </div>
          ) : null}
        </div>
      </details>
    </section>
  )
}
