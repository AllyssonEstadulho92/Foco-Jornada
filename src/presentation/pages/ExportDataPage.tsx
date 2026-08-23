import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildDayReport, type DayReport } from '../../application/reports/buildDayReport'
import { getActivityDurationMs } from '../../domain/activities/Activity'
import { getBreakDurationMs } from '../../domain/breaks/BreakRecord'
import { getFocusElapsedMs } from '../../domain/focus/FocusSession'
import { getScheduleSummary } from '../../domain/journey/WorkSchedule'
import type { AppSettings } from '../../domain/settings/AppSettings'
import { calculateWorkHours, formatHoursMinutes } from '../../domain/work-hours/WorkHours'
import { formatClockTime, formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'
import { useWorkHoursStore } from '../store/useWorkHoursStore'

type TimelineTone = 'journey' | 'break' | 'focus' | 'activity' | 'coffee'

interface TimelineRow {
  id: string
  timestamp: string
  label: string
  description: string
  duration: string
  tone: TimelineTone
}

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

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)
}

function signedHoursMinutes(value: number) {
  const formatted = formatHoursMinutes(value)
  return value > 0 ? `+${formatted}` : formatted
}

function buildTimeline(report: DayReport, nowIso: string): TimelineRow[] {
  const rows: TimelineRow[] = []

  report.journeys.forEach((journey) => {
    rows.push({
      id: `${journey.id}-entry`,
      timestamp: journey.startedAt,
      label: 'Entrada',
      description: 'Início da jornada',
      duration: '—',
      tone: 'journey',
    })
    if (journey.endedAt) {
      rows.push({
        id: `${journey.id}-exit`,
        timestamp: journey.endedAt,
        label: 'Saída',
        description: 'Fim da jornada',
        duration: '—',
        tone: 'journey',
      })
    }
  })

  report.breaks
    .filter((record) => record.status !== 'cancelled')
    .forEach((record) => {
      rows.push({
        id: `break-${record.id}`,
        timestamp: record.startedAt,
        label: 'Pausa',
        description: record.plannedDurationMinutes
          ? `Pausa registada · ${record.plannedDurationMinutes} min previstos`
          : 'Pausa registada',
        duration: formatDuration(getBreakDurationMs(record, record.endedAt ?? nowIso)),
        tone: 'break',
      })
    })

  report.focusSessions
    .filter((session) => session.segmentType === 'focus' && session.status !== 'cancelled')
    .forEach((session) => {
      rows.push({
        id: `focus-${session.id}`,
        timestamp: session.startedAt,
        label: 'Foco',
        description: session.mode === 'pomodoro' ? `Sessão Pomodoro · ciclo ${session.cycle}` : 'Sessão de foco personalizada',
        duration: formatDuration(getFocusElapsedMs(session, session.endedAt ?? nowIso)),
        tone: 'focus',
      })
    })

  report.activities
    .filter((activity) => activity.status !== 'cancelled' && Boolean(activity.startedAt))
    .forEach((activity) => {
      rows.push({
        id: `activity-${activity.id}`,
        timestamp: activity.startedAt ?? activity.createdAt,
        label: 'Atividade',
        description: activity.name,
        duration: formatDuration(getActivityDurationMs(activity, activity.endedAt ?? nowIso)),
        tone: 'activity',
      })
    })

  report.coffees.forEach((coffee) => {
    rows.push({
      id: `coffee-${coffee.id}`,
      timestamp: coffee.createdAt,
      label: coffee.quantity === 1 ? 'Café' : 'Cafés',
      description: coffee.quantity === 1 ? 'Café registado' : `${coffee.quantity} cafés registados`,
      duration: '—',
      tone: 'coffee',
    })
  })

  return rows.sort((left, right) => left.timestamp.localeCompare(right.timestamp))
}

function ReportMetric({ tone, icon, label, value, detail }: {
  tone: TimelineTone
  icon: string
  label: string
  value: string
  detail: string
}) {
  return (
    <article className={`exportA4Metric is-${tone}`}>
      <span className="exportA4MetricIcon" aria-hidden="true">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}

export function ExportDataPage() {
  const services = useAppServices()
  const workHourEntries = useWorkHoursStore((state) => state.entries)
  const [date, setDate] = useState(() => toLocalDateKey(new Date()))
  const [report, setReport] = useState<DayReport | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [nextReport, nextSettings] = await Promise.all([
        buildDayReport({
          journeyRepository: services.journeyRepository,
          breakRepository: services.breakRepository,
          activityRepository: services.activityRepository,
          focusRepository: services.focusRepository,
          coffeeRepository: services.coffeeRepository,
          date,
        }),
        services.settingsRepository.get(),
      ])
      setReport(nextReport)
      setSettings(nextSettings)
      setGeneratedAt(new Date())
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

  const nowIso = generatedAt.toISOString()
  const timeline = report ? buildTimeline(report, nowIso) : []
  const schedule = settings ? getScheduleSummary(settings.workSchedule, date) : null
  const plannedJourneyMs = schedule && schedule.totalMinutes > 0
    ? schedule.totalMinutes * 60_000
    : report?.summary.journeyMs ?? 0
  const plannedDetail = schedule && schedule.totalMinutes > 0 ? 'Tempo planeado' : 'Tempo registado'
  const workEntry = workHourEntries.find((entry) => entry.date === date)
  const workCalculation = workEntry ? calculateWorkHours(workEntry) : null
  const productivity = report && report.summary.effectiveMs > 0
    ? Math.min(100, Math.round((report.summary.focusMs / report.summary.effectiveMs) * 100))
    : 0
  const productivityMessage = productivity >= 75
    ? 'Mantém o foco e continua a fazer acontecer!'
    : productivity >= 40
      ? 'Bom ritmo. Mantém a consistência ao longo do dia.'
      : 'Regista o teu dia para acompanhares a evolução.'

  return (
    <section className="exportA4Page" aria-labelledby="export-a4-title">
      <header className="exportA4Toolbar">
        <div>
          <span className="eyebrow">RELATÓRIO</span>
          <h1 id="export-a4-title">Relatório diário A4</h1>
          <p>Consulta o relatório do dia e guarda-o em PDF ou imprime.</p>
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
                <strong><span>Foco</span> Jornada</strong>
                <small>Organiza o teu tempo, os turnos e o vencimento.</small>
              </div>
            </div>
            <div className="exportA4DocumentMeta">
              <strong>Relatório diário</strong>
              <span>▣ {formatReportDate(date)}</span>
            </div>
          </header>

          <section className="exportA4Summary" aria-label="Indicadores principais">
            <ReportMetric tone="journey" icon="◷" label="Jornada" value={formatDuration(plannedJourneyMs)} detail={plannedDetail} />
            <ReportMetric tone="break" icon="☕" label="Pausas" value={formatDuration(report.summary.breakMs)} detail="Total de pausas" />
            <ReportMetric tone="journey" icon="◎" label="Efetivo" value={formatDuration(report.summary.effectiveMs)} detail="Tempo efetivo" />
            <ReportMetric tone="focus" icon="⊙" label="Foco" value={formatDuration(report.summary.focusMs)} detail="Tempo de foco" />
            <ReportMetric tone="activity" icon="▤" label="Atividades" value={String(report.summary.activityCount)} detail="Concluídas" />
            <ReportMetric tone="coffee" icon="☕" label="Cafés" value={String(report.summary.coffeeCount)} detail="Cafés registados" />
          </section>

          <section className="exportA4Section">
            <div className="exportA4SectionTitle">
              <h2>Linha do tempo</h2>
              <strong>{timeline.length} {timeline.length === 1 ? 'registo' : 'registos'}</strong>
            </div>

            {timeline.length > 0 ? (
              <table className="exportA4Table">
                <thead>
                  <tr><th>Hora</th><th>Tipo</th><th>Descrição</th><th>Duração</th></tr>
                </thead>
                <tbody>
                  {timeline.map((item) => (
                    <tr key={item.id} className={`is-${item.tone}`}>
                      <td><span className="exportA4TimelineDot" aria-hidden="true" />{formatClockTime(item.timestamp)}</td>
                      <td><span className="exportA4TypeTag">{item.label}</span></td>
                      <td>{item.description}</td>
                      <td>{item.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="exportA4Empty">
                <strong>Sem registos neste dia</strong>
                <span>O relatório mostra apenas dados realmente guardados na aplicação.</span>
              </div>
            )}
          </section>

          <section className="exportA4Dashboard" aria-label="Resumo, desempenho e detalhes do dia">
            <article className="exportA4Panel exportA4DaySummary">
              <h3>Resumo do dia</h3>
              <dl>
                <div><dt>◷ Jornada planeada</dt><dd>{formatDuration(plannedJourneyMs)}</dd></div>
                <div><dt>☕ Pausas</dt><dd>{formatDuration(report.summary.breakMs)}</dd></div>
                <div><dt>◎ Tempo efetivo</dt><dd>{formatDuration(report.summary.effectiveMs)}</dd></div>
                <div><dt>⊙ Foco total</dt><dd>{formatDuration(report.summary.focusMs)}</dd></div>
                <div><dt>▤ Atividades concluídas</dt><dd>{report.summary.activityCount}</dd></div>
                <div><dt>☕ Cafés</dt><dd>{report.summary.coffeeCount}</dd></div>
              </dl>
            </article>

            <article className="exportA4Panel exportA4Performance">
              <h3>Desempenho</h3>
              <div className="exportA4Progress" style={{ '--progress': `${productivity * 3.6}deg` } as React.CSSProperties}>
                <strong>{productivity}%</strong>
              </div>
              <b>Produtividade</b>
              <span>Foco / Efetivo</span>
            </article>

            <article className="exportA4Panel exportA4Financial">
              <h3>Detalhes do dia</h3>
              <dl>
                <div><dt>Custo de café</dt><dd>{formatMoney(report.summary.coffeeCost)}</dd></div>
                <div><dt>Horas extra</dt><dd>{workCalculation ? formatDuration(workCalculation.overtimeMinutes * 60_000) : '00:00:00'}</dd></div>
                <div><dt>Faltas / ausências</dt><dd>{workCalculation ? formatDuration(workCalculation.nonWorkedMinutes * 60_000) : '00:00:00'}</dd></div>
                <div><dt>Saldo de horas</dt><dd>{workCalculation ? signedHoursMinutes(workCalculation.balanceMinutes) : '00:00'}</dd></div>
              </dl>
              <p><span aria-hidden="true">◆</span>{productivityMessage}</p>
            </article>
          </section>

          <footer className="exportA4Footer">
            <img src="./report-qr.svg" alt="QR code para abrir Foco Jornada" />
            <div>
              <span aria-hidden="true">▣</span>
              <p>Gerado em<br /><strong>{new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(generatedAt)}</strong></p>
            </div>
          </footer>
        </article>
      ) : null}

      <div className="exportA4Back"><Link to="/definicoes">Voltar às Definições</Link></div>
    </section>
  )
}
