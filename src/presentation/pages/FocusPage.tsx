import { useEffect, useMemo, useState } from 'react'
import {
  getFocusElapsedMs,
  getFocusRemainingMs,
  type FocusSegmentType,
  type FocusSession,
} from '../../domain/focus/FocusSession'
import { formatClockTime, formatDuration } from '../../shared/utils/dateTime'
import { useActivityController } from '../hooks/useActivityController'
import { useFocusController } from '../hooks/useFocusController'
import { useJourneyController } from '../hooks/useJourneyController'
import { useNow } from '../hooks/useNow'

function segmentLabel(segmentType: FocusSegmentType): string {
  if (segmentType === 'focus') return 'Foco'
  if (segmentType === 'short-break') return 'Pausa curta'
  return 'Pausa longa'
}

function sessionStatusLabel(session: FocusSession): string {
  if (session.status === 'running') return 'Em execução'
  if (session.status === 'paused') return 'Pausada'
  if (session.status === 'completed') return 'Concluída'
  return 'Cancelada'
}

export function FocusPage() {
  const { activeJourney, isLoading: journeyLoading } = useJourneyController()
  const { activeActivity } = useActivityController(activeJourney?.id)
  const {
    sessions,
    activeSession,
    recommendedStep,
    isLoading,
    isBusy,
    error,
    startPomodoro,
    startCustom,
    pause,
    resume,
    complete,
    cancel,
  } = useFocusController(activeJourney?.id)
  const [customMinutes, setCustomMinutes] = useState('50')
  const [associateActivity, setAssociateActivity] = useState(true)
  const now = useNow()
  const nowIso = now.toISOString()

  const remainingMs = activeSession ? getFocusRemainingMs(activeSession, nowIso) : 0
  const elapsedMs = activeSession ? getFocusElapsedMs(activeSession, nowIso) : 0

  useEffect(() => {
    if (activeSession?.status === 'running' && remainingMs === 0 && !isBusy) {
      void complete()
    }
  }, [activeSession?.status, complete, isBusy, remainingMs])

  const completedFocusCount = useMemo(
    () =>
      sessions.filter(
        (session) => session.segmentType === 'focus' && session.status === 'completed',
      ).length,
    [sessions],
  )

  const associatedActivityId =
    associateActivity && activeActivity && recommendedStep.segmentType === 'focus'
      ? activeActivity.id
      : undefined

  const customActivityId = associateActivity && activeActivity ? activeActivity.id : undefined

  return (
    <section className="focusPage" aria-labelledby="focus-title">
      <header className="focusHeader">
        <div>
          <span className="eyebrow">FOCO</span>
          <h1 id="focus-title">Foco & Pomodoro</h1>
          <p>Temporizador persistente, ciclos Pomodoro e sessões personalizadas.</p>
        </div>
        <span className={`focusJourneyState ${activeJourney ? 'focusJourneyStateActive' : ''}`}>
          {activeJourney ? 'Jornada ativa' : 'Sem jornada ativa'}
        </span>
      </header>

      {error ? (
        <div className="errorBanner" role="alert">
          {error}
        </div>
      ) : null}

      {activeSession ? (
        <section className="focusTimerPanel" aria-labelledby="active-focus-title">
          <div className="focusTimerTop">
            <div>
              <span className="sectionKicker">
                {activeSession.mode === 'pomodoro' ? `POMODORO · CICLO ${activeSession.cycle}/4` : 'PERSONALIZADO'}
              </span>
              <h2 id="active-focus-title">{segmentLabel(activeSession.segmentType)}</h2>
              <p>
                {activeSession.status === 'paused'
                  ? 'Temporizador pausado. O tempo não avança até retomares.'
                  : `Iniciada às ${formatClockTime(activeSession.startedAt)}`}
              </p>
            </div>
            <span className={`focusSessionStatus focusSessionStatus-${activeSession.status}`}>
              {sessionStatusLabel(activeSession)}
            </span>
          </div>

          <div className="focusClock" aria-live="polite">
            {formatDuration(remainingMs)}
          </div>

          <div className="focusProgress" aria-label="Progresso da sessão">
            <span
              style={{
                width: `${Math.min(100, (elapsedMs / (activeSession.plannedDurationSeconds * 1000)) * 100)}%`,
              }}
            />
          </div>

          {activeSession.activityId ? (
            <p className="focusAssociation">
              Associada à atividade: <strong>{activeActivity?.name ?? 'atividade registada'}</strong>
            </p>
          ) : null}

          <div className="focusTimerActions">
            {activeSession.status === 'running' ? (
              <button type="button" disabled={isBusy} onClick={() => void pause()}>
                Pausar
              </button>
            ) : (
              <button type="button" disabled={isBusy} onClick={() => void resume()}>
                Retomar
              </button>
            )}
            <button
              className="focusCompleteAction"
              type="button"
              disabled={isBusy}
              onClick={() => void complete()}
            >
              Concluir
            </button>
            <button
              className="focusCancelAction"
              type="button"
              disabled={isBusy}
              onClick={() => void cancel()}
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : (
        <div className="focusStartGrid">
          <section className="focusStartPanel" aria-labelledby="pomodoro-title">
            <div className="sectionHeadingRow">
              <div>
                <span className="sectionKicker">POMODORO</span>
                <h2 id="pomodoro-title">Próximo segmento</h2>
              </div>
              <span className="pomodoroCycle">{recommendedStep.cycle}/4</span>
            </div>

            <div className="recommendedFocus">
              <strong>{segmentLabel(recommendedStep.segmentType)}</strong>
              <span>{formatDuration(recommendedStep.plannedDurationSeconds * 1000)}</span>
              <p>25 min de foco · 5 min pausa curta · 15 min pausa longa após o 4.º ciclo.</p>
            </div>

            {activeActivity && recommendedStep.segmentType === 'focus' ? (
              <label className="focusAssociateToggle">
                <input
                  type="checkbox"
                  checked={associateActivity}
                  onChange={(event) => setAssociateActivity(event.target.checked)}
                />
                Associar a “{activeActivity.name}”
              </label>
            ) : null}

            <button
              className="actionButton actionButtonPrimary focusStartButton"
              type="button"
              disabled={!activeJourney || isBusy || journeyLoading || isLoading}
              onClick={() => void startPomodoro(recommendedStep, associatedActivityId)}
            >
              Iniciar {segmentLabel(recommendedStep.segmentType).toLowerCase()}
            </button>
          </section>

          <section className="focusStartPanel" aria-labelledby="custom-focus-title">
            <div className="sectionHeadingRow">
              <div>
                <span className="sectionKicker">PERSONALIZADO</span>
                <h2 id="custom-focus-title">Sessão livre</h2>
              </div>
            </div>

            <label className="customFocusInput">
              <span>Duração em minutos</span>
              <input
                type="number"
                min="1"
                max="480"
                inputMode="numeric"
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
              />
            </label>

            {activeActivity ? (
              <label className="focusAssociateToggle">
                <input
                  type="checkbox"
                  checked={associateActivity}
                  onChange={(event) => setAssociateActivity(event.target.checked)}
                />
                Associar a “{activeActivity.name}”
              </label>
            ) : null}

            <button
              className="actionButton actionButtonPrimary focusStartButton"
              type="button"
              disabled={
                !activeJourney ||
                isBusy ||
                journeyLoading ||
                isLoading ||
                !Number.isFinite(Number(customMinutes)) ||
                Number(customMinutes) <= 0 ||
                Number(customMinutes) > 480
              }
              onClick={() => void startCustom(Number(customMinutes), customActivityId)}
            >
              Iniciar sessão personalizada
            </button>
          </section>
        </div>
      )}

      {!activeJourney && !journeyLoading ? (
        <p className="focusHint">Inicia uma jornada no ecrã Hoje para utilizares o temporizador de foco.</p>
      ) : null}

      <section className="focusHistoryPanel" aria-labelledby="focus-history-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">HISTÓRICO</span>
            <h2 id="focus-history-title">Sessões desta jornada</h2>
          </div>
          <div className="focusCounters">
            <span>{completedFocusCount} focos</span>
            <span>{sessions.length} total</span>
          </div>
        </div>

        {isLoading ? (
          <p className="mutedText">A recuperar sessões…</p>
        ) : sessions.length === 0 ? (
          <div className="historyEmpty">Ainda não existem sessões de foco nesta jornada.</div>
        ) : (
          <div className="focusHistoryList">
            {sessions
              .slice()
              .reverse()
              .map((session) => (
                <article className="focusHistoryItem" key={session.id}>
                  <div>
                    <strong>
                      {session.mode === 'pomodoro' ? 'Pomodoro' : 'Personalizado'} ·{' '}
                      {segmentLabel(session.segmentType)}
                    </strong>
                    <span>
                      {formatClockTime(session.startedAt)} · ciclo {session.cycle}/4 ·{' '}
                      {sessionStatusLabel(session)}
                    </span>
                  </div>
                  <time>
                    {formatDuration(
                      session.status === 'completed' || session.status === 'cancelled'
                        ? getFocusElapsedMs(session, session.endedAt)
                        : getFocusElapsedMs(session, nowIso),
                    )}
                  </time>
                </article>
              ))}
          </div>
        )}
      </section>
    </section>
  )
}
