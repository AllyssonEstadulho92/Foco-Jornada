import { Link } from 'react-router-dom'
import { buildDayReport } from '../../application/reports/buildDayReport'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { NavigationIcon } from '../navigation/NavigationIcon'
import { useAppServices } from '../providers/AppServicesProvider'
import { pushAppNotification } from '../store/useNotificationStore'

function RowArrow() {
  return <span className="moreRowArrow" aria-hidden="true">›</span>
}

function SectionIcon({ type }: { type: 'quick' | 'management' }) {
  if (type === 'quick') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m13.5 2-8 11h6l-1 9 8-12h-6z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.6h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4.04v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.04h-.1A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  )
}

export function MorePage() {
  const services = useAppServices()

  async function exportToday() {
    try {
      const date = toLocalDateKey(new Date())
      const report = await buildDayReport({
        journeyRepository: services.journeyRepository,
        breakRepository: services.breakRepository,
        activityRepository: services.activityRepository,
        focusRepository: services.focusRepository,
        coffeeRepository: services.coffeeRepository,
        date,
      })

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `foco-jornada-${date}.json`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      pushAppNotification('success', 'Relatório exportado', 'O relatório do dia foi guardado em JSON.')
    } catch {
      pushAppNotification('error', 'Não foi possível exportar', 'Tenta novamente a partir do menu Mais.')
    }
  }

  return (
    <section className="reportPage morePage moreToolsPage" aria-labelledby="more-title">
      <header className="reportHeader moreHeader moreToolsHeader">
        <div>
          <span className="eyebrow">MAIS</span>
          <h1 id="more-title">Ferramentas</h1>
          <p>Organização, horas, vencimento e apoio.</p>
        </div>
      </header>

      <section className="moreToolSection" aria-labelledby="more-quick-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><SectionIcon type="quick" /></span>
          <h2 id="more-quick-title">Acesso rápido</h2>
        </div>

        <div className="moreList moreListGrouped">
          <Link to="/guia" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="guide" /></span>
            <span className="moreRowCopy">
              <strong>Guia de utilização</strong>
              <small>Como usar a aplicação</small>
            </span>
            <RowArrow />
          </Link>

          <Link to="/horas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="hours" /></span>
            <span className="moreRowCopy">
              <strong>Calculadora de horas & ausências</strong>
              <small>Horas trabalhadas, doença e saldo</small>
            </span>
            <RowArrow />
          </Link>

          <Link to="/vencimento" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="payroll" /></span>
            <span className="moreRowCopy">
              <strong>Vencimento & planificação</strong>
              <small>Previsão salarial e calendário</small>
            </span>
            <RowArrow />
          </Link>
        </div>
      </section>

      <section className="moreToolSection" aria-labelledby="more-management-title">
        <div className="moreSectionHeading">
          <span className="moreSectionHeadingIcon" aria-hidden="true"><SectionIcon type="management" /></span>
          <h2 id="more-management-title">Gestão</h2>
        </div>

        <div className="moreList moreListGrouped">
          <Link to="/estatisticas" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
            <span className="moreRowCopy">
              <strong>Estatísticas</strong>
              <small>Hoje, 7 dias e 30 dias</small>
            </span>
            <RowArrow />
          </Link>

          <Link to="/definicoes" className="moreRow">
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="settings" /></span>
            <span className="moreRowCopy">
              <strong>Definições</strong>
              <small>Horário, pausas, café e preferências</small>
            </span>
            <RowArrow />
          </Link>

          <button type="button" className="moreRow moreRowButton" onClick={() => void exportToday()}>
            <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="export" /></span>
            <span className="moreRowCopy">
              <strong>Exportar o dia</strong>
              <small>Guardar relatório em JSON</small>
            </span>
            <RowArrow />
          </button>
        </div>
      </section>

      <aside className="moreLocalCard" aria-label="Armazenamento local">
        <span className="moreLocalInfoIcon" aria-hidden="true">i</span>
        <div>
          <strong>Tudo fica guardado localmente</strong>
          <p>Os seus dados permanecem neste dispositivo.</p>
        </div>
        <span className="moreLocalShield" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 19 6v5c0 4.6-2.7 7.7-7 10-4.3-2.3-7-5.4-7-10V6z" />
            <rect x="9.2" y="10.4" width="5.6" height="4.8" rx="1.1" />
            <path d="M10.4 10.4V9.2a1.6 1.6 0 0 1 3.2 0v1.2" />
          </svg>
        </span>
      </aside>
    </section>
  )
}
