import { useState } from 'react'
import toast from 'react-hot-toast'
import type { DayEvent } from '../../application/reports/buildDayReport'
import { deleteDayEventRecord } from '../../application/reports/deleteDayEventRecord'
import { formatClockTime, formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useDayReport } from '../hooks/useDayReport'
import { useAppServices } from '../providers/AppServicesProvider'

export function HistoryPage() {
  const [date, setDate] = useState(() => toLocalDateKey(new Date()))
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const services = useAppServices()
  const { report, isLoading, error, refresh } = useDayReport(date)

  async function handleDelete(event: DayEvent) {
    const confirmed = window.confirm(
      event.recordType === 'journey'
        ? 'Eliminar esta jornada? Também serão eliminadas as pausas, atividades, sessões de foco e cafés associados.'
        : 'Eliminar este registo do histórico? Esta ação não pode ser anulada.',
    )

    if (!confirmed) return

    try {
      setDeletingRecordId(event.recordId)
      await deleteDayEventRecord({ event, ...services })
      await refresh()
      toast.success('Registo eliminado.')
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Erro ao eliminar o registo.')
    } finally {
      setDeletingRecordId(null)
    }
  }

  const eventCount = report?.events.length ?? 0

  return (
    <section className="historyPage" aria-labelledby="history-title">
      <header className="historyHeader">
        <div className="historyHeaderCopy">
          <span className="eyebrow">HISTÓRICO</span>
          <h1 id="history-title">Histórico diário</h1>
          <p>Consulta o resumo e os registos do dia.</p>
        </div>

        <label className="historyDateControl">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="2.5" />
            <path d="M8 3v4M16 3v4M4 10h16" />
          </svg>
          <input aria-label="Selecionar dia" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </header>

      {error ? <div className="errorBanner" role="alert">{error}</div> : null}

      {report ? (
        <section className="historySummaryCard" aria-label="Resumo do dia">
          <div className="historySummaryPrimary">
            <article className="historySummaryMetric">
              <span>Jornada</span>
              <strong>{formatDuration(report.summary.journeyMs)}</strong>
            </article>
            <article className="historySummaryMetric historySummaryMetricEffective">
              <span>Efetivo</span>
              <strong>{formatDuration(report.summary.effectiveMs)}</strong>
            </article>
            <article className="historySummaryMetric">
              <span>Pausas</span>
              <strong>{formatDuration(report.summary.breakMs)}</strong>
            </article>
          </div>

          <div className="historySummarySecondary">
            <div><span>Foco</span><strong>{formatDuration(report.summary.focusMs)}</strong></div>
            <div><span>Atividades</span><strong>{report.summary.activityCount}</strong></div>
            <div><span>Cafés</span><strong>{report.summary.coffeeCount}</strong></div>
            <div><span>Gasto</span><strong>{report.summary.coffeeCost.toFixed(2)} €</strong></div>
          </div>
        </section>
      ) : null}

      <section className="historyTimelinePanel" aria-labelledby="timeline-title">
        <div className="historyTimelineHeader">
          <div className="historyTimelineTitle">
            <span className="historyTimelineIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            </span>
            <div>
              <h2 id="timeline-title">Eventos do dia</h2>
              <span>{eventCount === 1 ? '1 registo' : `${eventCount} registos`}</span>
            </div>
          </div>
          <span className="historyEventCount" aria-label={`${eventCount} eventos`}>{eventCount}</span>
        </div>

        {isLoading ? (
          <p className="mutedText">A carregar histórico…</p>
        ) : !report || report.events.length === 0 ? (
          <div className="historyEmptyCompact">Não existem registos para este dia.</div>
        ) : (
          <div className="historyTimelineList">
            {report.events.map((event) => (
              <article className="historyTimelineItem" key={event.id}>
                <time>{formatClockTime(event.timestamp)}</time>
                <span className="historyTimelineDot" aria-hidden="true" />
                <div className="historyTimelineCopy">
                  <strong>{event.label}</strong>
                  {event.detail ? <span>{event.detail}</span> : null}
                </div>
                {event.deletable ? (
                  <button
                    type="button"
                    className="historyDeleteIconButton"
                    onClick={() => void handleDelete(event)}
                    disabled={deletingRecordId === event.recordId}
                    aria-label={`Eliminar registo: ${event.label}`}
                    title="Eliminar registo"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
                    </svg>
                  </button>
                ) : (
                  <span className="historyActivePill">Ativo</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
