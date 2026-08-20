import { useMemo, useState } from 'react'
import { getEffectiveJourneyDurationMs } from '../../application/journey/getEffectiveJourneyDuration'
import { getActivityDurationMs } from '../../domain/activities/Activity'
import { getBreakDurationMs } from '../../domain/breaks/BreakRecord'
import { getJourneyDurationMs } from '../../domain/journey/Journey'
import { formatClockTime, formatDuration } from '../../shared/utils/dateTime'
import { useActivityController } from '../hooks/useActivityController'
import { useBreakController } from '../hooks/useBreakController'
import { useJourneyController } from '../hooks/useJourneyController'
import { useNow } from '../hooks/useNow'

export function TodayPage() {
  const { activeJourney, todayJourneys, isLoading, isBusy, error, start, finish } =
    useJourneyController()
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
  const [customMinutes, setCustomMinutes] = useState('30')
  const now = useNow()
  const nowIso = now.toISOString()

  const totalBreakDurationMs = useMemo(
    () =>
      breaks
        .filter((record) => record.status !== 'cancelled')
        .reduce((total, record) => total + getBreakDurationMs(record, nowIso), 0),
    [breaks, nowIso],
  )

  const effectiveDurationMs = activeJourney
    ? getEffectiveJourneyDurationMs(activeJourney, breaks, nowIso)
    : 0

  async function handleFinish() {
    const openItems: string[] = []
    if (activeBreak) openItems.push('uma pausa ativa')
    if (activeActivity) openItems.push(`a atividade "${activeActivity.name}"`)

    const message =
      openItems.length > 0
        ? `Existe ${openItems.join(' e ')}. Ao terminar a jornada, estes registos serão encerrados automaticamente. Continuar?`
        : 'Terminar a jornada atual?'

    const confirmed = window.confirm(message)
    if (confirmed) {
      await finish()
    }
  }

  function handleCustomBreak() {
    const minutes = Number(customMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) return
    void startBreak('custom', Math.round(minutes))
  }

  const statusLabel = activeBreak ? 'Em pausa' : activeJourney ? 'Em trabalho' : 'Sem jornada ativa'

  return (
    <section className="todayPage" aria-labelledby="page-title">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">HOJE</span>
          <h1 id="page-title">Foco & Jornada</h1>
          <p>Controlo da jornada, pausas, atividades e tempo efetivo do dia.</p>
        </div>
        <span
          className={`journeyStatus ${activeJourney ? 'journeyStatusActive' : ''} ${activeBreak ? 'journeyStatusPaused' : ''}`}
        >
          <span className="journeyStatusDot" aria-hidden="true" />
          {statusLabel}
        </span>
      </header>

      {error || breakError || activityError ? (
        <div className="errorBanner" role="alert">
          {error ?? breakError ?? activityError}
        </div>
      ) : null}

      <section className="journeyPanel" aria-labelledby="journey-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">JORNADA</span>
            <h2 id="journey-title">Jornada de trabalho</h2>
          </div>
          {isLoading ? <span className="loadingLabel">A carregar…</span> : null}
        </div>

        <div className="journeyMetrics journeyMetricsFour">
          <article className="metricCard">
            <span>Entrada</span>
            <strong>{activeJourney ? formatClockTime(activeJourney.startedAt) : '—'}</strong>
          </article>
          <article className="metricCard">
            <span>Jornada</span>
            <strong>
              {activeJourney
                ? formatDuration(getJourneyDurationMs(activeJourney, nowIso))
                : '00:00:00'}
            </strong>
          </article>
          <article className="metricCard metricCardEffective">
            <span>Tempo efetivo</span>
            <strong>{formatDuration(effectiveDurationMs)}</strong>
          </article>
          <article className="metricCard">
            <span>Pausas</span>
            <strong>{formatDuration(totalBreakDurationMs)}</strong>
          </article>
        </div>

        <div className="journeyActions">
          {activeJourney ? (
            <button
              className="actionButton actionButtonDanger"
              type="button"
              disabled={isBusy || isLoading}
              onClick={() => void handleFinish()}
            >
              {isBusy ? 'A terminar…' : 'Terminar jornada'}
            </button>
          ) : (
            <button
              className="actionButton actionButtonPrimary"
              type="button"
              disabled={isBusy || isLoading}
              onClick={() => void start()}
            >
              {isBusy ? 'A iniciar…' : 'Iniciar jornada'}
            </button>
          )}
        </div>
      </section>

      {activeActivity ? (
        <section className="todayActivityPanel" aria-labelledby="today-activity-title">
          <div>
            <span className="sectionKicker">ATIVIDADE ATUAL</span>
            <h2 id="today-activity-title">{activeActivity.name}</h2>
            <p>
              {activeActivity.description ??
                `Em curso desde ${formatClockTime(activeActivity.startedAt)}`}
            </p>
          </div>
          <strong className="todayActivityTimer">
            {formatDuration(getActivityDurationMs(activeActivity, nowIso))}
          </strong>
        </section>
      ) : null}

      <section className="breakPanel" aria-labelledby="break-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">PAUSAS</span>
            <h2 id="break-title">Gestão de pausas</h2>
          </div>
          <span className="historyCount">{breaks.length}</span>
        </div>

        {activeBreak ? (
          <div className="activeBreakCard">
            <div>
              <span className="breakLiveLabel">PAUSA ATIVA</span>
              <strong>{formatDuration(getBreakDurationMs(activeBreak, nowIso))}</strong>
              <p>
                Iniciada às {formatClockTime(activeBreak.startedAt)}
                {activeBreak.plannedDurationMinutes
                  ? ` · prevista: ${activeBreak.plannedDurationMinutes} min`
                  : ''}
              </p>
            </div>
            <button
              className="actionButton actionButtonPrimary"
              type="button"
              disabled={isBreakBusy}
              onClick={() => void finishBreak()}
            >
              {isBreakBusy ? 'A terminar…' : 'Terminar pausa'}
            </button>
          </div>
        ) : (
          <div className="breakActions" aria-label="Iniciar pausa">
            <button
              className="breakShortcut"
              type="button"
              disabled={!activeJourney || isBreakBusy || isLoadingBreaks}
              onClick={() => void startBreak('short', 15)}
            >
              <strong>15 min</strong>
              <span>Pausa curta</span>
            </button>
            <button
              className="breakShortcut"
              type="button"
              disabled={!activeJourney || isBreakBusy || isLoadingBreaks}
              onClick={() => void startBreak('long', 60)}
            >
              <strong>60 min</strong>
              <span>Pausa longa</span>
            </button>
            <div className="customBreak">
              <label htmlFor="custom-break-minutes">Personalizada</label>
              <div>
                <input
                  id="custom-break-minutes"
                  inputMode="numeric"
                  min="1"
                  type="number"
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                />
                <button
                  type="button"
                  disabled={!activeJourney || isBreakBusy || Number(customMinutes) <= 0}
                  onClick={handleCustomBreak}
                >
                  Iniciar
                </button>
              </div>
            </div>
          </div>
        )}

        {!activeJourney ? (
          <p className="breakHint">Inicia uma jornada para poderes registar pausas.</p>
        ) : null}

        {breaks.length > 0 ? (
          <div className="breakHistory">
            {breaks
              .slice()
              .reverse()
              .map((record) => (
                <article className="breakHistoryItem" key={record.id}>
                  <div>
                    <strong>
                      {record.type === 'short'
                        ? 'Pausa curta'
                        : record.type === 'long'
                          ? 'Pausa longa'
                          : 'Pausa personalizada'}
                    </strong>
                    <span>
                      {formatClockTime(record.startedAt)} → {formatClockTime(record.endedAt)}
                    </span>
                  </div>
                  <time>{formatDuration(getBreakDurationMs(record, nowIso))}</time>
                </article>
              ))}
          </div>
        ) : null}
      </section>

      <section className="journeyHistory" aria-labelledby="today-history-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">REGISTOS</span>
            <h2 id="today-history-title">Jornadas de hoje</h2>
          </div>
          <span className="historyCount">{todayJourneys.length}</span>
        </div>

        {isLoading ? (
          <p className="mutedText">A recuperar os dados guardados no dispositivo…</p>
        ) : todayJourneys.length === 0 ? (
          <div className="historyEmpty">
            Ainda não existem jornadas registadas hoje. Inicia a primeira quando estiveres pronto.
          </div>
        ) : (
          <div className="historyList">
            {todayJourneys.map((journey) => (
              <article className="historyItem" key={journey.id}>
                <div>
                  <strong>{journey.status === 'active' ? 'Jornada em curso' : 'Jornada concluída'}</strong>
                  <span>
                    {formatClockTime(journey.startedAt)} → {formatClockTime(journey.endedAt)}
                  </span>
                </div>
                <time>{formatDuration(getJourneyDurationMs(journey, journey.endedAt ?? nowIso))}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
