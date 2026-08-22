import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEffectiveJourneyDurationMs } from '../../application/journey/getEffectiveJourneyDuration'
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
import { formatClockTime, formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useActivityController } from '../hooks/useActivityController'
import { useBreakController } from '../hooks/useBreakController'
import { useCoffeeController } from '../hooks/useCoffeeController'
import { useDayReport } from '../hooks/useDayReport'
import { useFocusController } from '../hooks/useFocusController'
import { useJourneyController } from '../hooks/useJourneyController'
import { useNow } from '../hooks/useNow'
import { useSettingsController } from '../hooks/useSettingsController'

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
  const { activeActivity, error: activityError } = useActivityController(activeJourney?.id)
  const {
    sessions: focusSessions,
    activeSession: activeFocus,
    isBusy: isFocusBusy,
    error: focusError,
    startPomodoro,
    pause: pauseFocus,
    resume: resumeFocus,
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

  const journeyDurationMs = activeJourney
    ? getJourneyDurationMs(activeJourney, nowIso)
    : report?.summary.journeyMs ?? 0
  const effectiveDurationMs = activeJourney
    ? getEffectiveJourneyDurationMs(activeJourney, breaks, nowIso)
    : report?.summary.effectiveMs ?? 0
  const breakDurationMs = useMemo(
    () => breaks.filter((item) => item.status !== 'cancelled').reduce((sum, item) => sum + getBreakDurationMs(item, nowIso), 0),
    [breaks, nowIso],
  )
  const focusDurationMs = useMemo(
    () => focusSessions.filter((item) => item.segmentType === 'focus' && item.status !== 'cancelled').reduce((sum, item) => sum + getFocusElapsedMs(item, item.endedAt ?? nowIso), 0),
    [focusSessions, nowIso],
  )
  const completedFocusCount = focusSessions.filter((item) => item.segmentType === 'focus' && item.status === 'completed').length
  const productivity = journeyDurationMs > 0 ? Math.min(100, Math.round((effectiveDurationMs / journeyDurationMs) * 100)) : 0

  const focusRemainingMs = activeFocus ? getFocusRemainingMs(activeFocus, nowIso) : 0
  const focusProgress = activeFocus
    ? Math.min(100, Math.max(0, Math.round((getFocusElapsedMs(activeFocus, nowIso) / (activeFocus.plannedDurationSeconds * 1000)) * 100)))
    : activeJourney
      ? Math.min(100, Math.max(5, productivity))
      : 0

  const mainTitle = activeFocus
    ? 'Foco atual'
    : activeBreak
      ? 'Pausa em curso'
      : activeJourney
        ? 'Jornada ativa'
        : 'Pronto para começar'
  const mainSubtitle = activeActivity?.name
    ?? (activeFocus ? 'Trabalho profundo' : resolvedSchedule.isWorkingDay ? `${resolvedSchedule.startTime}–${resolvedSchedule.endTime}` : 'Dia sem jornada planeada')
  const mainTime = activeFocus
    ? formatFocusTime(focusRemainingMs)
    : activeJourney
      ? formatDuration(effectiveDurationMs)
      : nextScheduleEvent.time ?? '—'
  const mainTimeLabel = activeFocus ? 'Tempo restante' : activeJourney ? 'Tempo efetivo' : nextScheduleEvent.label

  const dateLabel = new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)

  const pageError = error ?? breakError ?? activityError ?? focusError ?? coffeeError ?? settingsError

  async function handleStartJourney() {
    await start()
    await refreshReport()
  }

  async function handleFinishJourney() {
    if (!window.confirm('Terminar a jornada atual? Os registos em curso serão encerrados de forma consistente.')) return
    await finish()
    await refreshReport()
  }

  async function handlePrimaryAction() {
    if (activeFocus) {
      if (activeFocus.status === 'paused') await resumeFocus()
      else await pauseFocus()
      return
    }
    if (activeBreak) {
      await finishBreak()
      await refreshReport()
      return
    }
    if (activeJourney) {
      await startPomodoro()
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
          <h2>Bom dia, foco! <i aria-hidden="true">✦</i></h2>
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
          <button
            type="button"
            className="referenceProgressAction"
            style={{ '--focus-progress': `${focusProgress * 3.6}deg` } as React.CSSProperties}
            onClick={() => void handlePrimaryAction()}
            disabled={busy}
            aria-label={activeFocus?.status === 'paused' ? 'Retomar foco' : activeFocus ? 'Pausar foco' : activeBreak ? 'Terminar pausa' : activeJourney ? 'Iniciar foco' : 'Iniciar jornada'}
          >
            <span>{activeFocus?.status === 'paused' ? '▶' : activeFocus ? 'Ⅱ' : '▶'}</span>
          </button>
        </div>

        <div className="referenceEncouragement">
          <span aria-hidden="true">⌁</span>
          <p>{activeBreak ? 'A pausa está registada. Retoma quando estiveres pronto.' : activeJourney ? 'Mantém o foco, estás a avançar bem.' : 'Começa a jornada quando estiveres pronto.'}</p>
        </div>
      </section>

      <section className="referenceSummaryCard" aria-labelledby="reference-summary-title">
        <header>
          <div><span className="referenceSummaryGlyph" aria-hidden="true">▥</span><h2 id="reference-summary-title">Resumo do dia</h2></div>
          <Link to="/historico">Ver tudo <span aria-hidden="true">›</span></Link>
        </header>
        <div className="referenceSummaryGrid">
          <article>
            <strong>{completedFocusCount}</strong>
            <span>Sessões</span>
            <small>{completedFocusCount > 0 ? `+${completedFocusCount} hoje` : 'Sem sessões'}</small>
          </article>
          <article>
            <strong>{formatDuration(focusDurationMs)}</strong>
            <span>Foco total</span>
            <small>{activeFocus ? 'Em curso' : 'Acumulado'}</small>
          </article>
          <article>
            <strong>{productivity}%</strong>
            <span>Produtividade</span>
            <small>{formatDuration(effectiveDurationMs)} efetivo</small>
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
              <button type="button" onClick={() => void startBreak('short', 15)} disabled={busy}>Pausa 15 min</button>
            ) : null}
            {activeBreak ? (
              <button type="button" onClick={() => void finishBreak()} disabled={busy}>Terminar pausa</button>
            ) : null}
            <Link to="/atividades">Atividades</Link>
            <Link to="/foco">Foco</Link>
            <button type="button" onClick={() => void addCoffee(1)} disabled={busy}>Café +1 registo</button>
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
