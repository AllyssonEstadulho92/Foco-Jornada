import { useEffect, useMemo, useState, type CSSProperties } from 'react'
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
  const {
    activeJourney,
    isLoading: journeyLoading,
    isBusy: journeyBusy,
    start: startJourneyIfNeeded,
  } = useJourneyController()
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
  const [startMode, setStartMode] = useState<'pomodoro' | 'custom'>('pomodoro')
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
    () => sessions.filter((session) => session.segmentType === 'focus' && session.status === 'completed').length,
    [sessions],
  )

  const associatedActivityId =
    associateActivity && activeActivity && recommendedStep.segmentType === 'focus'
      ? activeActivity.id
      : undefined

  const customActivityId = associateActivity && activeActivity ? activeActivity.id : undefined

  const progress = activeSession
    ? Math.min(100, (elapsedMs / (activeSession.plannedDurationSeconds * 1000)) * 100)
    : 0
  const dialStyle = { '--focus-progress': `${progress * 3.6}deg` } as CSSProperties

  async function ensureJourney(): Promise<boolean> {
    if (activeJourney) return true
    return Boolean(await startJourneyIfNeeded())
  }

  async function handleStartPomodoro() {
    if (!(await ensureJourney())) return
    await startPomodoro(recommendedStep, associatedActivityId)
  }

  async function handleStartCustom() {
    const minutes = Number(customMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 480) return
    if (!(await ensureJourney())) return
    await startCustom(minutes, customActivityId)
  }

  return (
    <section className="focusPage" aria-labelledby="focus-title">
      <header className="focusHeader">
        <div>
          <span className="eyebrow">FOCO</span>
          <h1 id="focus-title">Foco</h1>
          <p>Concentra-te numa tarefa de cada vez.</p>
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
        <section className="focusTimerPanel focusPrototypePanel" aria-labelledby="active-focus-title">
          <div className="focusTimerTop">
            <div>
              <span className="sectionKicker">
                {activeSession.mode === 'pomodoro' ? `POMODORO · CICLO ${activeSession.cycle}/4` : 'PERSONALIZADO'}
              </span>
              <h2 id="active-focus-title">{segmentLabel(activeSession.segmentType)}</h2>
            </div>
            <span className={`focusSessionStatus focusSessionStatus-${activeSession.status}`}>
              {sessionStatusLabel(activeSession)}
            </span>
          </div>

          <div className="focusDial" style={dialStyle} aria-live="polite">
            <div className="focusDialInner">
              <span>{segmentLabel(activeSession.segmentType).toUpperCase()}</span>
              <strong>{formatDuration(remainingMs)}</strong>
              <small>Ciclo {activeSession.cycle} / 4</small>
            </div>
          </div>

          {activeSession.activityId ? (
            <p className="focusAssociation focusAssociationCentered">
              {activeActivity?.name ?? 'Atividade registada'}
            </p>
          ) : (
            <p className="focusAssociation focusAssociationCentered">
              Iniciada às {formatClockTime(activeSession.startedAt)}
            </p>
          )}

          <div className="focusTimerActions focusPrototypeActions">
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
              className="focusCancelAction"
              type="button"
              disabled={isBusy}
              onClick={() => void cancel()}
            >
              Terminar sessão
            </button>
          </div>
        </section>
      ) : (
        <section className="focusStartPanel focusPrototypePanel" aria-label="Iniciar sessão de foco">
          <div className="focusModeTabs" role="tablist" aria-label="Modo de foco">
            <button
              type="button"
              role="tab"
              aria-selected={startMode === 'pomodoro'}
              className={startMode === 'pomodoro' ? 'focusModeTab focusModeTabActive' : 'focusModeTab'}
              onClick={() => setStartMode('pomodoro')}
            >
              Pomodoro
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={startMode === 'custom'}
              className={startMode === 'custom' ? 'focusModeTab focusModeTabActive' : 'focusModeTab'}
              onClick={() => setStartMode('custom')}
            >
              Personalizado
            </button>
          </div>

          {startMode === 'pomodoro' ? (
            <>
              <div className="focusDial focusDialReady">
                <div className="focusDialInner">
                  <span>{segmentLabel(recommendedStep.segmentType).toUpperCase()}</span>
                  <strong>{formatDuration(recommendedStep.plannedDurationSeconds * 1000)}</strong>
                  <small>Ciclo {recommendedStep.cycle} / 4</small>
                </div>
              </div>

              {activeActivity && recommendedStep.segmentType === 'focus' ? (
                <label className="focusAssociateToggle focusAssociateCentered">
                  <input
                    type="checkbox"
                    checked={associateActivity}
                    onChange={(event) => setAssociateActivity(event.target.checked)}
                  />
                  Associar a “{activeActivity.name}”
                </label>
              ) : null}

              <p className="focusPrototypeDescription">
                25 min de foco · 5 min pausa curta · 15 min pausa longa após o 4.º ciclo.
              </p>

              <button
                className="actionButton actionButtonPrimary focusStartButton"
                type="button"
                disabled={isBusy || journeyBusy || journeyLoading || isLoading}
                onClick={() => void handleStartPomodoro()}
              >
                Iniciar foco
              </button>
            </>
          ) : (
            <>
              <div className="customFocusCompact">
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
              </div>

              {activeActivity ? (
                <label className="focusAssociateToggle focusAssociateCentered">
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
                  isBusy ||
                  journeyBusy ||
                  journeyLoading ||
                  isLoading ||
                  !Number.isFinite(Number(customMinutes)) ||
                  Number(customMinutes) <= 0 ||
                  Number(customMinutes) > 480
                }
                onClick={() => void handleStartCustom()}
              >
                Iniciar sessão personalizada
              </button>
            </>
          )}

          {!activeJourney && !journeyLoading ? (
            <p className="focusHint focusHintCentered">Ao iniciar o foco, a jornada começa automaticamente.</p>
          ) : null}
        </section>
      )}

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
