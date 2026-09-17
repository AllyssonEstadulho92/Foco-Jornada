import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  collectVacationEvidenceForYear,
  type VacationEvidenceSource,
} from '../../domain/vacation/VacationYearRecords'
import { secureStorage } from '../../security/secureStorage'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useWorkHoursStore } from '../store/useWorkHoursStore'
import '../../styles/vacation-evidence.css'

const sourceLabels: Record<VacationEvidenceSource, string> = {
  horas: 'Calculadora de horas',
  turnos: 'Mapa de turnos',
  plano: 'Plano mensal',
}

const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
})

function isWeekend(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return weekday === 0 || weekday === 6
}

/** Audit view only: the authoritative amounts remain in VacationBalancePage/VacationBalance. */
export function VacationEvidencePanel() {
  const entries = useWorkHoursStore((state) => state.entries)
  const [expanded, setExpanded] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [revision, setRevision] = useState(0)
  const today = toLocalDateKey(now)
  const year = now.getFullYear()

  useEffect(() => {
    const refresh = () => setNow(new Date())
    const onVisibility = () => { if (!document.hidden) refresh() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const evidence = useMemo(
    () => expanded
      ? collectVacationEvidenceForYear(year, entries, (key) => secureStorage.getItem(key))
      : [],
    [expanded, year, entries, revision],
  )
  const taken = evidence.filter((item) => !isWeekend(item.date) && item.date <= today).length
  const planned = evidence.filter((item) => !isWeekend(item.date) && item.date > today).length
  const ignored = evidence.filter((item) => isWeekend(item.date)).length

  return (
    <section className="vacationEvidencePanel" aria-labelledby="vacation-evidence-title">
      <div className="vacationEvidenceHeading">
        <div>
          <span className="vacationEvidenceEyebrow">TRANSPARÊNCIA DOS REGISTOS · {year}</span>
          <h2 id="vacation-evidence-title" tabIndex={-1}>De onde vêm os teus dias?</h2>
          <p>Abre o detalhe para consultar cada data uma única vez, mesmo quando aparece em várias áreas.</p>
        </div>
        <button type="button" className="vacationEvidenceToggle"
          aria-expanded={expanded} aria-controls="vacation-evidence-content"
          onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Ocultar detalhe' : 'Ver dias e fontes'}
          <span aria-hidden="true">{expanded ? '−' : '+'}</span>
        </button>
      </div>
      <div id="vacation-evidence-content" className="vacationEvidenceBody" hidden={!expanded}>
        <p className="vacationEvidenceFormula">
          <strong>Como ler o saldo pessoal:</strong> acumulado até agora + dias transitados + ajustes − férias
          já gozadas (registadas e manuais). O saldo após planeadas desconta ainda as datas futuras registadas.
          A meta pessoal não substitui o direito contratual.
        </p>
        <div className="vacationEvidenceTotals" aria-label="Contagem das datas registadas">
          <div><span>Úteis até hoje</span><strong>{taken}</strong></div>
          <div><span>Úteis futuros</span><strong>{planned}</strong></div>
          <div><span>Fins de semana ignorados</span><strong>{ignored}</strong></div>
        </div>
        <div className="vacationEvidenceTools">
          <p>Consulta local de {year}. Fontes duplicadas na mesma data não duplicam o desconto.</p>
          <button type="button" onClick={() => { setNow(new Date()); setRevision((value) => value + 1) }}>
            Atualizar consulta
          </button>
        </div>
        {evidence.length === 0 ? (
          <p className="vacationEvidenceEmpty" role="status">
            Nenhuma data de férias disponível nas fontes acessíveis deste ano. Confirma o desbloqueio do perfil e os registos.
          </p>
        ) : (
          <ul className="vacationEvidenceList" aria-label="Datas e fontes de férias">
            {evidence.map(({ date, sources }) => {
              const weekend = isWeekend(date)
              const state = weekend ? 'Fim de semana · não desconta' : date <= today ? 'Útil · até hoje' : 'Útil · planeado'
              return (
                <li key={date} className="vacationEvidenceDay">
                  <div className="vacationEvidenceDayTop">
                    <strong><time dateTime={date}>{dateFormatter.format(new Date(`${date}T00:00:00Z`))}</time></strong>
                    <span className={weekend ? 'isIgnored' : ''}>{state}</span>
                  </div>
                  <small>Origem: {sources.map((source) => sourceLabels[source]).join(' · ')}</small>
                </li>
              )
            })}
          </ul>
        )}
        <p className="vacationEvidenceFootnote">
          Os dias gozados introduzidos manualmente não têm uma data associada e, por isso, não aparecem nesta lista;
          continuam a ser descontados no saldo. Feriados e escalas de descanso especiais exigem confirmação.
        </p>
        <div className="vacationEvidenceLinks">
          <NavLink to="/turnos">Ver mapa de turnos</NavLink>
          <NavLink to="/horas">Ver calculadora de horas</NavLink>
        </div>
      </div>
    </section>
  )
}
