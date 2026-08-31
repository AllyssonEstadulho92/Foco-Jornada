import { useEffect, useMemo, useState } from 'react'
import { buildPeriodReport, type PeriodKind, type PeriodReport } from '../../application/reports/buildPeriodReport'
import { formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'

function downloadCsv(report: PeriodReport) {
  const rows = [
    ['Data', 'Jornada', 'Efetivo', 'Pausas', 'Foco', 'Atividades', 'Cafés', 'Custo café'],
    ...report.days.map((day) => [
      day.date,
      formatDuration(day.summary.journeyMs),
      formatDuration(day.summary.effectiveMs),
      formatDuration(day.summary.breakMs),
      formatDuration(day.summary.focusMs),
      String(day.summary.activityCount),
      String(day.summary.coffeeCount),
      day.summary.coffeeCost.toFixed(2).replace('.', ','),
    ]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `foco-jornada-${report.kind}-${report.startDate}-${report.endDate}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ReportsV2Page() {
  const services = useAppServices()
  const [kind, setKind] = useState<PeriodKind>('week')
  const [anchorDate, setAnchorDate] = useState(() => toLocalDateKey(new Date()))
  const [report, setReport] = useState<PeriodReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void buildPeriodReport({
      kind,
      anchorDate,
      journeyRepository: services.journeyRepository,
      breakRepository: services.breakRepository,
      activityRepository: services.activityRepository,
      focusRepository: services.focusRepository,
      coffeeRepository: services.coffeeRepository,
    }).then((next) => {
      if (!cancelled) setReport(next)
    }).catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Erro ao gerar relatório.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [anchorDate, kind, services])

  const productivity = useMemo(() => {
    if (!report?.totals.effectiveMs) return 0
    return Math.min(100, Math.round((report.totals.focusMs / report.totals.effectiveMs) * 100))
  }, [report])

  return (
    <section className="opsPage" aria-labelledby="reports-v2-title">
      <header className="opsPageHeader">
        <div>
          <span className="opsEyebrow">RELATÓRIOS V2</span>
          <h1 id="reports-v2-title">Semana e mês num só resumo</h1>
          <p>Agrega apenas registos realmente guardados. Nenhuma duração é inventada.</p>
        </div>
        <div className="opsControls">
          <select value={kind} onChange={(event) => setKind(event.target.value as PeriodKind)} aria-label="Período do relatório">
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </select>
          <input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} aria-label="Data de referência" />
          <button type="button" disabled={!report} onClick={() => report && downloadCsv(report)}>Exportar CSV</button>
        </div>
      </header>

      {error ? <div className="errorBanner">{error}</div> : null}
      {loading ? <div className="opsLoading">A calcular o período…</div> : null}

      {report ? (
        <>
          <div className="opsSummaryGrid">
            <article><span>Período</span><strong>{report.startDate} → {report.endDate}</strong><small>{report.activeDays} dias com registos</small></article>
            <article><span>Jornada</span><strong>{formatDuration(report.totals.journeyMs)}</strong><small>Tempo registado</small></article>
            <article><span>Efetivo</span><strong>{formatDuration(report.totals.effectiveMs)}</strong><small>Jornada menos pausas</small></article>
            <article><span>Foco</span><strong>{formatDuration(report.totals.focusMs)}</strong><small>{productivity}% do tempo efetivo</small></article>
            <article><span>Pausas</span><strong>{formatDuration(report.totals.breakMs)}</strong><small>Total real</small></article>
            <article><span>Atividades</span><strong>{report.totals.activityCount}</strong><small>Concluídas</small></article>
          </div>

          <div className="opsTableCard">
            <div className="opsTableHeader"><strong>Detalhe diário</strong><span>{report.days.length} dias</span></div>
            <div className="opsTableScroll">
              <table className="opsTable">
                <thead><tr><th>Data</th><th>Jornada</th><th>Efetivo</th><th>Pausas</th><th>Foco</th><th>Atividades</th><th>Cafés</th></tr></thead>
                <tbody>
                  {report.days.map((day) => (
                    <tr key={day.date} className={day.events.length ? '' : 'isEmpty'}>
                      <td>{day.date}</td>
                      <td>{formatDuration(day.summary.journeyMs)}</td>
                      <td>{formatDuration(day.summary.effectiveMs)}</td>
                      <td>{formatDuration(day.summary.breakMs)}</td>
                      <td>{formatDuration(day.summary.focusMs)}</td>
                      <td>{day.summary.activityCount}</td>
                      <td>{day.summary.coffeeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
