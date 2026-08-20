import { useState } from 'react'
import { formatDuration } from '../../shared/utils/dateTime'
import { useStatisticsController, type StatisticsPeriod } from '../hooks/useStatisticsController'

export function StatisticsPage() {
  const [period, setPeriod] = useState<StatisticsPeriod>('week')
  const { reports, totals, isLoading, error } = useStatisticsController(period)

  return (
    <section className="reportPage" aria-labelledby="statistics-title">
      <header className="reportHeader">
        <div>
          <span className="eyebrow">ESTATÍSTICAS</span>
          <h1 id="statistics-title">Produtividade</h1>
          <p>Agregação local dos registos de jornada e foco.</p>
        </div>
        <div className="periodTabs" aria-label="Período das estatísticas">
          {(['day', 'week', 'month'] as const).map((value) => (
            <button
              type="button"
              className={period === value ? 'periodTab periodTabActive' : 'periodTab'}
              key={value}
              onClick={() => setPeriod(value)}
            >
              {value === 'day' ? 'Hoje' : value === 'week' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </header>

      {error ? <div className="errorBanner" role="alert">{error}</div> : null}

      <div className="summaryGrid">
        <article><span>Jornada</span><strong>{formatDuration(totals.journeyMs)}</strong></article>
        <article><span>Tempo efetivo</span><strong>{formatDuration(totals.effectiveMs)}</strong></article>
        <article><span>Pausas</span><strong>{formatDuration(totals.breakMs)}</strong></article>
        <article><span>Foco</span><strong>{formatDuration(totals.focusMs)}</strong></article>
        <article><span>Atividades</span><strong>{totals.activityCount}</strong></article>
        <article><span>Cafés</span><strong>{totals.coffeeCount}</strong></article>
        <article><span>Gasto</span><strong>{totals.coffeeCost.toFixed(2)} €</strong></article>
      </div>

      <section className="timelinePanel" aria-labelledby="daily-breakdown-title">
        <div className="sectionHeadingRow">
          <div>
            <span className="sectionKicker">EVOLUÇÃO</span>
            <h2 id="daily-breakdown-title">Resumo por dia</h2>
          </div>
        </div>
        {isLoading ? (
          <p className="mutedText">A calcular estatísticas…</p>
        ) : (
          <div className="statsDailyList">
            {reports
              .filter((report) => report.summary.journeyMs > 0 || report.summary.coffeeCount > 0)
              .map((report) => (
                <article key={report.date}>
                  <strong>{report.date}</strong>
                  <span>{formatDuration(report.summary.effectiveMs)} efetivo</span>
                  <span>{formatDuration(report.summary.focusMs)} foco</span>
                  <span>{report.summary.coffeeCount} cafés</span>
                </article>
              ))}
            {reports.every((report) => report.summary.journeyMs === 0 && report.summary.coffeeCount === 0) ? (
              <div className="historyEmpty">Ainda não existem dados neste período.</div>
            ) : null}
          </div>
        )}
      </section>
    </section>
  )
}
