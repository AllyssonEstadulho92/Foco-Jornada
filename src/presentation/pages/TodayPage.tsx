import { type CSSProperties, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEffectiveJourneyDurationMs } from '../../application/journey/getEffectiveJourneyDuration'
import { getActivityDurationMs } from '../../domain/activities/Activity'
import { getBreakDurationMs } from '../../domain/breaks/BreakRecord'
import { getFocusElapsedMs } from '../../domain/focus/FocusSession'
import { getJourneyDurationMs } from '../../domain/journey/Journey'
import {
  formatPlannedMinutes,
  getNextScheduleEvent,
  getScheduleMilestones,
  getScheduleProgress,
  getScheduleSummary,
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

type DashboardIcon = 'pause' | 'focus' | 'coffee' | 'activity' | 'clock'

function DashboardIcon({ type }: { type: DashboardIcon }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (type === 'pause') {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5v7M14.5 8.5v7" /></svg>
  }
  if (type === 'focus') {
    return <svg {...common}><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
  }
  if (type === 'coffee') {
    return <svg {...common}><path d="M5 8h11v5a5 5 0 0 1-5 5H9a4 4 0 0 1-4-4V8Z" /><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4v2M12 4v2" /></svg>
  }
  if (type === 'activity') {
    return <svg {...common}><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
  }
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
}

export function TodayPage() {
  const { activeJourney, isLoading, isBusy, error, start, finish } = useJourneyController()
  const {
    activeBreak,
    breaks,
    isLoading: isLoadingBreaks,
    isBusy: isBreakBusy,
    error: breakError,
    start: startBreak,
    finish: finishBreak,
  } = useBreakController(activeJourney?.id)
  const { activeActivity, error: activityError } = useActivityController(activeJourney?.id)
  const {
    sessions: focusSessions,
    activeSession: activeFocus,
    error: focusError,
  } = useFocusController(activeJourney?.id)
  const {
    totals: coffeeTotals,
    isBusy: isCoffeeBusy,
    error: coffeeError,
    add: addCoffee,
  } = useCoffeeController()
  const { settings, error: settingsError } = useSettingsController()
  const [customMinutes, setCustomMinutes] = useState('30')
  const now = useNow()
  const nowIso = now.toISOString()
  const todayKey = toLocalDateKey(now)
  const { report, refresh: refreshReport } = useDayReport(todayKey)

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }).format(now),
    [todayKey],
  )

  const totalBreakDurationMs = useMemo(
    () =>
      breaks
        .filter((record) => record.status !== 'cancelled')
        .reduce((total, record) => total + getBreakDurationMs(record, nowIso), 0),
    [breaks, nowIso],
  )

  const focusDurationMs = useMemo(
    () =>
      focusSessions
        .filter((session) => session.segmentType === 'focus' && session.status !== 'cancelled')
        .reduce((total, session) => total + getFocusElapsedMs(session, session.endedAt ?? nowIso), 0),
    [focusSessions, nowIso],
  )

  const completedFocusCount = focusSessions.filter(
    (session) => session.segmentType === 'focus' && session.status === 'completed',
  ).length

  const effectiveDurationMs = activeJourney
    ? getEffectiveJourneyDurationMs(activeJourney, breaks, nowIso)
    : report?.summary.effectiveMs ?? 0

  const schedule = settings.workSchedule
  const scheduleMilestones = getScheduleMilestones(schedule)
  const scheduleSummary = getScheduleSummary(schedule)
  const nextScheduleEvent = getNextScheduleEvent(schedule, now)
  const scheduleProgress = getScheduleProgress(schedule, now)
  const scheduleStyle = {
    '--schedule-count': Math.max(scheduleMilestones.length, 1),
    '--schedule-progress': scheduleProgress,
  } as CSSProperties

  async function handleFinish() {
    const openItems: string[] = []
    if (activeBreak) openItems.push('uma pausa ativa')
    if (activeActivity) openItems.push(`a atividade "${activeActivity.name}"`)
    if (activeFocus) openItems.push('uma sessão de foco aberta')

    const message =
      openItems.length > 0
        ? `Existem registos em curso (${openItems.join(', ')}). Ao terminar a jornada serão encerrados de forma consistente. Continuar?`
        : 'Terminar a jornada atual?'

    if (!window.confirm(message)) return
    await finish()
    await refreshReport()
  }

  async function handleStartJourney() {
    await start()
    await refreshReport()
  }

  async function handleStartBreak(type: 'short' | 'long', minutes: number) {
    await startBreak(type, minutes)
    await refreshReport()
  }

  async function handleFinishBreak() {
    await finishBreak()
    await refreshReport()
  }

  async function handleCustomBreak() {
    const minutes = Number(customMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) return
    await startBreak('custom', Math.round(minutes))
    await refreshReport()
  }

  async function handleCoffee() {
    await addCoffee(1)
    await refreshReport()
  }

  const statusLabel = activeBreak
    ? 'Em pausa'
    : activeFocus?.segmentType === 'focus'
      ? 'Em foco'
      : activeJourney
        ? 'Em trabalho'
        : 'Sem jornada ativa'

  const pageError = error ?? breakError ?? activityError ?? focusError ?? coffeeError ?? settingsError
  const recentEvents = report?.events.slice(-5) ?? []

  const nextEventClass =
    nextScheduleEvent.state === 'break'
      ? ' scheduleNextEventBreak'
      : nextScheduleEvent.state === 'done'
        ? ' scheduleNextEventDone'
        : ''

  return (
    <section className="todayPage todayDashboard" aria-labelledby="page-title">
      <header className="todayHero">
        <div>
          <h1 id="page-title">Hoje</h1>
          <p>{dateLabel}</p>
        </div>
        <span
          className={`journeyStatus ${activeJourney ? 'journeyStatusActive' : ''} ${activeBreak ? 'journeyStatusPaused' : ''}`}
        >
          <span className="journeyStatusDot" aria-hidden="true" />
          {statusLabel}
        </span>
      </header>

      {pageError ? <div className="errorBanner" role="alert">{pageError}</div> : null}

      <section className="todayJourneyCard" aria-labelledby="journey-title">
        <div className="todayCardHeader">
          <div>
            <span className="sectionKicker">JORNADA</span>
            <h2 id="journey-title">Jornada de trabalho</h2>
          </div>
          {activeJourney ? (
            <button
              className="todayHeaderAction todayHeaderActionDanger"
              type="button"
              disabled={isBusy || isLoading}
              onClick={() => void handleFinish()}
            >
              Terminar
            </button>
          ) : (
            <Link className="scheduleSettingsLink" to="/definicoes">Editar horário</Link>
          )}
        </div>

        <div className="scheduleBoard">
          <div className={`scheduleNextEvent${nextEventClass}`}>
            <span>{nextScheduleEvent.label}</span>
            <strong>{nextScheduleEvent.time ?? 'Concluída'}</strong>
          </div>

          <div className="scheduleTimeline" style={scheduleStyle} aria-label="Linha do horário planeado">
            <span className="scheduleTrack" aria-hidden="true" />
            <span className="scheduleProgress" aria-hidden="true" />
            {scheduleMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`scheduleMilestone scheduleMilestone${milestone.kind.charAt(0).toUpperCase()}${milestone.kind.slice(1)}`}
              >
                <i className="scheduleMilestoneDot" aria-hidden="true" />
                <span>{milestone.label}</span>
                <strong>{milestone.time}</strong>
              </div>
            ))}
          </div>

          <div className="scheduleLiveMetrics" aria-label="Registos reais da jornada">
            <article>
              <span>Entrada real</span>
              <strong>{activeJourney ? formatClockTime(activeJourney.startedAt) : '—'}</strong>
            </article>
            <article>
              <span>Jornada decorrida</span>
              <strong>{activeJourney ? formatDuration(getJourneyDurationMs(activeJourney, nowIso)) : '00:00:00'}</strong>
            </article>
            <article>
              <span>Tempo efetivo</span>
              <strong>{formatDuration(effectiveDurationMs)}</strong>
            </article>
            <article>
              <span>Pausas reais</span>
              <strong>{formatDuration(totalBreakDurationMs)}</strong>
            </article>
          </div>

          <div className="schedulePlanSummary">
            <span>Planeado: <strong>{formatPlannedMinutes(scheduleSummary.totalMinutes)}</strong> jornada</span>
            <span><strong>{formatPlannedMinutes(scheduleSummary.breakMinutes)}</strong> pausas</span>
            <span><strong>{formatPlannedMinutes(scheduleSummary.effectiveMinutes)}</strong> efetivo</span>
            <Link className="scheduleSettingsLink" to="/definicoes">Configurar</Link>
          </div>

          {!activeJourney ? (
            <div className="todayJourneyEmpty">
              <div className="todayEmptyIcon"><DashboardIcon type="clock" /></div>
              <div>
                <strong>Horário planeado pronto.</strong>
                <span>Inicia a jornada; o plano permanece fixo e os tempos reais são registados separadamente.</span>
              </div>
              <button className="actionButton actionButtonPrimary" type="button" disabled={isBusy || isLoading} onClick={() => void handleStartJourney()}>
                {isBusy ? 'A iniciar…' : 'Iniciar jornada'}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="todayProductivityGrid" aria-label="Resumo de produtividade">
        <Link className="todayProductivityCard todayProductivityActivity" to="/atividades">
          <span>Atividade atual</span>
          <strong>{activeActivity?.name ?? 'Nenhuma atividade'}</strong>
          <small>
            {activeActivity
              ? `${formatDuration(getActivityDurationMs(activeActivity, nowIso))} em curso`
              : 'Toca para criar ou iniciar uma atividade'}
          </small>
        </Link>
        <Link className="todayProductivityCard" to="/foco">
          <span>Foco</span>
          <strong>{completedFocusCount}</strong>
          <small>{activeFocus ? 'Sessão em curso' : `${formatDuration(focusDurationMs)} acumulado`}</small>
        </Link>
        <button className="todayProductivityCard todayCoffeeCard" type="button" disabled={isCoffeeBusy} onClick={() => void handleCoffee()}>
          <span>Café</span>
          <strong>{coffeeTotals.quantity}</strong>
          <small>{coffeeTotals.cost.toFixed(2)} €</small>
        </button>
      </section>

      {activeBreak ? (
        <section className="todayActiveBreak" aria-label="Pausa ativa">
          <div className="todayActiveBreakIcon"><DashboardIcon type="pause" /></div>
          <div>
            <span>PAUSA ATIVA</span>
            <strong>{formatDuration(getBreakDurationMs(activeBreak, nowIso))}</strong>
            <small>Iniciada às {formatClockTime(activeBreak.startedAt)}</small>
          </div>
          <button type="button" disabled={isBreakBusy} onClick={() => void handleFinishBreak()}>
            Terminar pausa
          </button>
        </section>
      ) : null}

      <section className="todayQuickPanel" aria-labelledby="quick-actions-title">
        <div className="todaySectionTitle">
          <h2 id="quick-actions-title">Ações rápidas</h2>
          <span>Mais usadas</span>
        </div>
        <div className="todayQuickGrid">
          <button type="button" disabled={!activeJourney || isBreakBusy || isLoadingBreaks || Boolean(activeBreak)} onClick={() => void handleStartBreak('short', 15)}>
            <i className="quickIcon quickIconAmber"><DashboardIcon type="pause" /></i>
            <span><strong>Pausa</strong><small>15 min</small></span>
          </button>
          <button type="button" disabled={!activeJourney || isBreakBusy || isLoadingBreaks || Boolean(activeBreak)} onClick={() => void handleStartBreak('long', 60)}>
            <i className="quickIcon quickIconRed"><DashboardIcon type="pause" /></i>
            <span><strong>Pausa</strong><small>60 min</small></span>
          </button>
          <Link to="/foco">
            <i className="quickIcon quickIconBlue"><DashboardIcon type="focus" /></i>
            <span><strong>Iniciar foco</strong><small>Pomodoro</small></span>
          </Link>
          <button type="button" disabled={isCoffeeBusy} onClick={() => void handleCoffee()}>
            <i className="quickIcon quickIconGreen"><DashboardIcon type="coffee" /></i>
            <span><strong>Café</strong><small>+1 registo</small></span>
          </button>
          <Link to="/atividades" className="todayQuickWide">
            <i className="quickIcon"><DashboardIcon type="activity" /></i>
            <span><strong>Nova atividade</strong><small>Criar e iniciar</small></span>
          </Link>
        </div>

        <details className="todayCustomBreak">
          <summary>Pausa personalizada</summary>
          <div>
            <label htmlFor="custom-break-minutes">Duração</label>
            <input id="custom-break-minutes" inputMode="numeric" min="1" type="number" value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)} />
            <span>min</span>
            <button type="button" disabled={!activeJourney || isBreakBusy || Boolean(activeBreak) || Number(customMinutes) <= 0} onClick={() => void handleCustomBreak()}>
              Iniciar
            </button>
          </div>
        </details>
      </section>

      <div className="todayLowerGrid">
        <section className="todayTimelineCard" aria-labelledby="today-history-title">
          <div className="todaySectionTitle">
            <h2 id="today-history-title">Histórico de hoje</h2>
            <Link to="/historico">Ver tudo</Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="todayEmptyText">Ainda não existem registos hoje.</p>
          ) : (
            <div className="todayTimelineList">
              {recentEvents.map((event) => (
                <div key={event.id} className="todayTimelineRow">
                  <time>{formatClockTime(event.timestamp)}</time>
                  <span className="todayTimelineDot" aria-hidden="true" />
                  <div><strong>{event.label}</strong>{event.detail ? <small>{event.detail}</small> : null}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="todaySummaryCard" aria-labelledby="today-summary-title">
          <div className="todaySectionTitle"><h2 id="today-summary-title">Resumo do dia</h2></div>
          <dl>
            <div><dt>Tempo efetivo</dt><dd>{formatDuration(effectiveDurationMs)}</dd></div>
            <div><dt>Pausas</dt><dd>{formatDuration(totalBreakDurationMs || report?.summary.breakMs || 0)}</dd></div>
            <div><dt>Foco</dt><dd>{formatDuration(focusDurationMs || report?.summary.focusMs || 0)}</dd></div>
            <div><dt>Atividades</dt><dd>{report?.summary.activityCount ?? 0}</dd></div>
            <div><dt>Cafés</dt><dd>{coffeeTotals.quantity}</dd></div>
            <div><dt>Gasto</dt><dd>{coffeeTotals.cost.toFixed(2)} €</dd></div>
          </dl>
        </section>
      </div>
    </section>
  )
}
