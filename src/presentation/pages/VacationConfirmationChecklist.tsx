import { useState } from 'react'
import '../../styles/vacation-confirmations.css'

interface VacationConfirmationChecklistProps {
  periodLabel: string
}

/** Confirmações de organização exclusivamente locais e efémeras; nunca aprovam nem registam férias. */
export function VacationConfirmationChecklist({ periodLabel }: VacationConfirmationChecklistProps) {
  const [partnerChecked, setPartnerChecked] = useState(false)
  const [employerChecked, setEmployerChecked] = useState(false)
  const complete = partnerChecked && employerChecked

  return (
    <section className="vacationJointConfirmations" aria-labelledby="vacation-joint-confirmations-title">
      <div className="vacationJointConfirmationsHeading">
        <div>
          <span className="vacationJointEyebrow">04 · CONFIRMAR ANTES DE MARCAR</span>
          <h4 id="vacation-joint-confirmations-title">Confirmações deste período</h4>
        </div>
        <span className={`vacationJointConfirmationBadge${complete ? ' isComplete' : ''}`}>
          {complete ? '2 de 2 assinaladas' : `${Number(partnerChecked) + Number(employerChecked)} de 2 assinaladas`}
        </span>
      </div>
      <p className="vacationJointConfirmationPeriod">
        Apenas para <strong>{periodLabel}</strong>. Se alterares as datas, os filtros ou os registos, estas assinalações são repostas.
      </p>
      <div className="vacationJointConfirmationChoices">
        <label>
          <input type="checkbox" checked={partnerChecked}
            onChange={(event) => setPartnerChecked(event.target.checked)} />
          <span>Já confirmei as datas com a minha parceira.</span>
        </label>
        <label>
          <input type="checkbox" checked={employerChecked}
            onChange={(event) => setEmployerChecked(event.target.checked)} />
          <span>Já recebi confirmação da entidade empregadora.</span>
        </label>
      </div>
      <p className="vacationJointConfirmationStatus" role="status" aria-live="polite">
        {complete
          ? 'Assinalaste as duas confirmações para este período; não é enviado qualquer pedido à empresa.'
          : 'Confirmações por assinalar: esta lista serve apenas para organização pessoal.'}
      </p>
      <small>Os vistos não são verificados pela aplicação, não representam aprovação e não são guardados.</small>
    </section>
  )
}
