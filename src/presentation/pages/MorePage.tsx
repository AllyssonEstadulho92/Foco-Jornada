import { Link } from 'react-router-dom'
import { buildDayReport } from '../../application/reports/buildDayReport'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { NavigationIcon } from '../navigation/NavigationIcon'
import { useAppServices } from '../providers/AppServicesProvider'
import { pushAppNotification } from '../store/useNotificationStore'

function RowArrow() {
  return <span className="moreRowArrow" aria-hidden="true">›</span>
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
    <section className="reportPage morePage" aria-labelledby="more-title">
      <header className="reportHeader moreHeader">
        <div>
          <span className="eyebrow">MAIS</span>
          <h1 id="more-title">Mais</h1>
          <p>Ferramentas profissionais para jornada, horas, vencimento, análise e organização.</p>
        </div>
      </header>

      <div className="moreList">
        <Link to="/horas" className="moreRow">
          <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="hours" /></span>
          <span className="moreRowCopy">
            <strong>Horas & ocorrências</strong>
            <small>Horas previstas, trabalhadas, não trabalhadas, doença, saídas antecipadas e saldo mensal</small>
          </span>
          <RowArrow />
        </Link>

        <Link to="/vencimento" className="moreRow">
          <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="payroll" /></span>
          <span className="moreRowCopy">
            <strong>Vencimento & planificação</strong>
            <small>Dias trabalhados, folgas, feriados, horas extra e previsão para dia 25</small>
          </span>
          <RowArrow />
        </Link>

        <Link to="/estatisticas" className="moreRow">
          <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="stats" /></span>
          <span className="moreRowCopy">
            <strong>Estatísticas</strong>
            <small>Hoje, últimos 7 dias e últimos 30 dias</small>
          </span>
          <RowArrow />
        </Link>

        <Link to="/definicoes" className="moreRow">
          <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="settings" /></span>
          <span className="moreRowCopy">
            <strong>Definições</strong>
            <small>Horário fixo, pausas, café, moeda e preferências</small>
          </span>
          <RowArrow />
        </Link>

        <button type="button" className="moreRow moreRowButton" onClick={() => void exportToday()}>
          <span className="moreRowIcon" aria-hidden="true"><NavigationIcon name="export" /></span>
          <span className="moreRowCopy">
            <strong>Exportar o dia</strong>
            <small>Guardar o relatório de hoje em JSON</small>
          </span>
          <RowArrow />
        </button>
      </div>

      <div className="moreAboutCard">
        <span className="moreAboutMark" aria-hidden="true">FJ</span>
        <div>
          <strong>Foco & Jornada</strong>
          <p>Produtividade com propósito · dados guardados localmente neste dispositivo.</p>
        </div>
      </div>
    </section>
  )
}
