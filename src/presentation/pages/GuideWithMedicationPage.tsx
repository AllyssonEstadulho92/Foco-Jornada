import { Link } from 'react-router-dom'
import { GuidePage } from './GuidePage'

export function GuideWithMedicationPage() {
  return (
    <>
      <GuidePage />
      <section className="reportPage guidePage" id="medicamentos" aria-labelledby="guide-medications-title">
        <div className="guideQuickStart">
          <div>
            <span className="sectionKicker">STOCK PESSOAL</span>
            <h2 id="guide-medications-title">Tomas programadas e ações rápidas</h2>
            <p>Consulta o guia específico para perceber Pendente, Atrasada, Adiada, Tomada, Não tomada, o menu ···, as correções e o histórico auditável.</p>
          </div>
          <Link className="guideAction" to="/guia/medicamentos">Abrir guia de Medicamentos</Link>
        </div>
      </section>
    </>
  )
}
