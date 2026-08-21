import { useState } from 'react'
import toast from 'react-hot-toast'
import { deleteDayEventRecord } from '../../application/reports/deleteDayEventRecord'
import type { DayEvent } from '../../application/reports/buildDayReport'
import { formatClockTime, formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'
import { useDayReport } from '../hooks/useDayReport'

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

  return (
    <section className="reportPage" aria-labelledby="history-title">
      <header className="reportHeader">
        <div>
          <span className="eyebrow">HISTÓRICO</span>
          <h1 id="history-title">Histórico diário</h1>
          <p>Timeline reconstruída a partir dos registos persistidos no dispositivo.</p>
        </div>
        <label className="datePicker">
          <span>Dia</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </header>

      {error ? <div className="errorBanner" role="alert">{error}</div> : null}

      {report ? (
        <div className="summaryGrid">
          <article><span>Jornada</span><strong>{formatDuration(report.summary.journeyMs)}</strong></article>
          <article><span>Tempo efetivo</span><strong>{formatDuration(report.summary.effectiveMs)}</strong></article>
          <article><span>Pausas</span><strong>{formatDuration(report.summary.breakMs)}</strong></article>
          <article><span>Foco</span><strong>{formatDuration(report.summary.focusMs)}</strong></article>
          <article><span>Atividades</span><strong>{report.summary.activityCount}</strong></article>
          <article><span>Cafés</span><strong>{report.summary.coffeeCount}</strong></article>
          <article><span>Gasto</span><strong>{report.summary.coffeeCost.toFixed(2)} €</strong></article>
        </div>
      ) : null}

      <section className="timelinePanel" aria-labelledby="timeline-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">TIMELINE</span>
            <h2 id="timeline-title">Eventos do dia</h2>
          </div>
          <span className="historyCount">{report?.events.length ?? 0}</span>
        </div>

        {isLoading ? (
          <p className="mutedText">A carregar histórico…</p>
        ) : !report || report.events.length === 0 ? (
          <div className="historyEmpty">Não existem registos para este dia.</div>
        ) : (
          <div className="timelineList">
            {report.events.map((event) => (
              <article className="timelineItem" key={event.id}>
                <time>{formatClockTime(event.timestamp)}</time>
                <div className="timelineItemContent">
                  <strong>{event.label}</strong>
                  {event.detail ? <span>{event.detail}</span> : null}
                </div>
                {event.deletable ? (
                  <button
                    type="button"
                    className="timelineDeleteButton"
                    onClick={() => void handleDelete(event)}
                    disabled={deletingRecordId === event.recordId}
                    aria-label={`Eliminar registo: ${event.label}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
                    </svg>
                    <span>{deletingRecordId === event.recordId ? 'A eliminar…' : 'Eliminar'}</span>
                  </button>
                ) : (
                  <span className="timelineActiveBadge">Ativo</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
