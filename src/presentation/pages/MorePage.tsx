import { Link } from 'react-router-dom'
import { buildDayReport } from '../../application/reports/buildDayReport'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'

export function MorePage() {
  const services = useAppServices()

  async function exportToday() {
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
  }

  return (
    <section className="reportPage" aria-labelledby="more-title">
      <header className="reportHeader">
        <div>
          <span className="eyebrow">MAIS</span>
          <h1 id="more-title">Mais</h1>
          <p>Estatísticas, definições e portabilidade dos teus dados locais.</p>
        </div>
      </header>

      <div className="moreGrid">
        <Link to="/estatisticas" className="moreCard">
          <span>ANÁLISE</span>
          <strong>Estatísticas</strong>
          <p>Consulta os totais de hoje, 7 dias ou 30 dias.</p>
        </Link>
        <Link to="/definicoes" className="moreCard">
          <span>PREFERÊNCIAS</span>
          <strong>Definições</strong>
          <p>Preço do café, moeda e intervalo sugerido para pausas.</p>
        </Link>
        <button type="button" className="moreCard moreCardButton" onClick={() => void exportToday()}>
          <span>PORTABILIDADE</span>
          <strong>Exportar o dia</strong>
          <p>Descarrega o relatório de hoje em JSON.</p>
        </button>
      </div>
    </section>
  )
}
