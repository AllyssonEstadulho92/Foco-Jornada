import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildDayReport, type DayReport } from '../../application/reports/buildDayReport'
import { formatClockTime, formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'

function formatReportDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateKey
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function reportCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function ExportDataPage() {
  const services = useAppServices()
  const [date, setDate] = useState(() => toLocalDateKey(new Date()))
  const [report, setReport] = useState<DayReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextReport = await buildDayReport({
        journeyRepository: services.journeyRepository,
        breakRepository: services.breakRepository,
        activityRepository: services.activityRepository,
        focusRepository: services.focusRepository,
        coffeeRepository: services.coffeeRepository,
        date,
      })
      setReport(nextReport)
    } catch (loadError) {
      setReport(null)
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível preparar o relatório.')
    } finally {
      setIsLoading(false)
    }
  }, [date, services])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  return (
    <section className="exportA4Page" aria-labelledby="export-a4-title">
      <header className="exportA4Toolbar">
        <div>
          <span className="eyebrow">EXPORTAR DADOS</span>
          <h1 id="export-a4-title">Relatório A4</h1>
          <p>Consulta o dia numa folha organizada e guarda em PDF ou imprime.</p>
        </div>
        <div className="exportA4ToolbarActions">
          <label>
            <span>Dia</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <button type="button" className="button buttonSecondary" onClick={() => void loadReport()} disabled={isLoading}>
            Atualizar
          </button>
          <button type="button" className="button buttonPrimary" onClick={() => window.print()} disabled={isLoading || !report}>
            Guardar PDF / imprimir
          </button>
        </div>
      </header>

      {error ? <div className="errorBanner" role="alert">{error}</div> : null}
      {isLoading ? <div className="exportA4Loading" role="status">A preparar o relatório…</div> : null}

      {report ? (
        <article className="exportA4Sheet" aria-label={`Relatório Foco Jornada de ${formatReportDate(date)}`}>
          <header className="exportA4BrandHeader">
            <div className="exportA4Brand">
              <img src="./logo-mark.svg" alt="Logótipo Foco Jornada" />
              <div>
                <strong>Foco Jornada</strong>
                <span>Relatório diário</span>
              </div>
            </div>
            <div className="exportA4DocumentMeta">
              <strong>{formatReportDate(date)}</strong>
              <span>Documento gerado pela aplicação</span>
            </div>
          </header>

          <section className="exportA4Summary" aria-label="Resumo do dia">
            <article><span>Jornada</span><strong>{formatDuration(report.summary.journeyMs)}</strong></article>
            <article><span>Pausas</span><strong>{formatDuration(report.summary.breakMs)}</strong></article>
            <article><span>Efetivo</span><strong>{formatDuration(report.summary.effectiveMs)}</strong></article>
            <article><span>Foco</span><strong>{formatDuration(report.summary.focusMs)}</strong></article>
            <article><span>Atividades</span><strong>{report.summary.activityCount}</strong></article>
            <article><span>Cafés</span><strong>{report.summary.coffeeCount}</strong></article>
          </section>

          <section className="exportA4Section">
            <div className="exportA4SectionTitle">
              <div>
                <span>REGISTOS</span>
                <h2>Linha do tempo</h2>
              </div>
              <strong>{reportCountLabel(report.events.length, 'evento', 'eventos')}</strong>
            </div>

            {report.events.length > 0 ? (
              <table className="exportA4Table">
                <thead>
                  <tr><th>Hora</th><th>Registo</th><th>Detalhe</th></tr>
                </thead>
                <tbody>
                  {report.events.map((event) => (
                    <tr key={event.id}>
                      <td>{formatClockTime(event.timestamp)}</td>
                      <td>{event.label}</td>
                      <td>{event.detail ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="exportA4Empty">Não existem registos para este dia.</div>
            )}
          </section>

          <section className="exportA4Totals" aria-label="Totais adicionais">
            <div><span>Jornadas</span><strong>{report.journeys.length}</strong></div>
            <div><span>Pausas registadas</span><strong>{report.breaks.filter((item) => item.status !== 'cancelled').length}</strong></div>
            <div><span>Sessões de foco</span><strong>{report.focusSessions.filter((item) => item.status !== 'cancelled').length}</strong></div>
            <div><span>Custo de café</span><strong>{report.summary.coffeeCost.toFixed(2)} €</strong></div>
          </section>

          <footer className="exportA4Footer">
            <span>Foco Jornada · versão {__APP_VERSION__} · compilação {__APP_BUILD_ID__}</span>
            <span>Gerado em {new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</span>
          </footer>
        </article>
      ) : null}

      <div className="exportA4Back"><Link to="/definicoes">Voltar às Definições</Link></div>
    </section>
  )
}
