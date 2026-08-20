import { getJourneyDurationMs } from '../../domain/journey/Journey'
import { formatClockTime, formatDuration } from '../../shared/utils/dateTime'
import { useJourneyController } from '../hooks/useJourneyController'
import { useNow } from '../hooks/useNow'

export function TodayPage() {
  const { activeJourney, todayJourneys, isLoading, isBusy, error, start, finish } =
    useJourneyController()
  const now = useNow()
  const nowIso = now.toISOString()

  async function handleFinish() {
    const confirmed = window.confirm('Terminar a jornada atual?')
    if (confirmed) {
      await finish()
    }
  }

  return (
    <section className="todayPage" aria-labelledby="page-title">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">HOJE</span>
          <h1 id="page-title">Foco & Jornada</h1>
          <p>Controlo da jornada de hoje. As restantes áreas serão integradas por fases.</p>
        </div>
        <span className={`journeyStatus ${activeJourney ? 'journeyStatusActive' : ''}`}>
          <span className="journeyStatusDot" aria-hidden="true" />
          {activeJourney ? 'Em trabalho' : 'Sem jornada ativa'}
        </span>
      </header>

      {error ? (
        <div className="errorBanner" role="alert">
          {error}
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

        <div className="journeyMetrics">
          <article className="metricCard">
            <span>Entrada</span>
            <strong>{activeJourney ? formatClockTime(activeJourney.startedAt) : '—'}</strong>
          </article>
          <article className="metricCard">
            <span>Duração</span>
            <strong>
              {activeJourney
                ? formatDuration(getJourneyDurationMs(activeJourney, nowIso))
                : '00:00:00'}
            </strong>
          </article>
          <article className="metricCard">
            <span>Estado</span>
            <strong>{activeJourney ? 'Em trabalho' : 'Parada'}</strong>
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
                <time>
                  {formatDuration(getJourneyDurationMs(journey, journey.endedAt ?? nowIso))}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
