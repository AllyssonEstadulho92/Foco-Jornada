import { NavLink } from 'react-router-dom'
import { focusSection } from '../navigation/focusSection'
import { VacationBalancePage } from './VacationBalancePage'
import { VacationEvidencePanel } from './VacationEvidencePanel'
import '../../styles/vacation-workspace.css'
import '../../styles/vacation-planning-year.css'
import '../../styles/vacation-evidence-layout.css'
import '../../styles/vacation-visual-audit.css'
import '../../styles/vacation-planning-structure.css'
import '../../styles/vacation-prototype.css'

type VacationWorkspaceView = 'overview' | 'planning'

/** Two distinct, directly linkable views of the same vacation data and calculations. */
export function VacationWorkspacePage({ view }: { view: VacationWorkspaceView }) {
  const planning = view === 'planning'

  return (
    <div className={`vacationWorkspace vacationWorkspace--${view}`}>
      <nav className="vacationWorkspaceNavigation" aria-label="Áreas das férias">
        <NavLink to="/ferias" end className={({ isActive }) => `vacationWorkspaceTab${isActive ? ' isActive' : ''}`}>
          <span className="vacationWorkspaceTabNumber" aria-hidden="true">01</span>
          <span className="vacationWorkspaceTabCopy">
            <strong>Acumulação e saldo</strong>
            <small>Meses, evolução e indicadores</small>
          </span>
          <span className="vacationWorkspaceTabArrow" aria-hidden="true">↗</span>
        </NavLink>
        <NavLink to="/ferias/planeamento" className={({ isActive }) => `vacationWorkspaceTab${isActive ? ' isActive' : ''}`}>
          <span className="vacationWorkspaceTabNumber" aria-hidden="true">02</span>
          <span className="vacationWorkspaceTabCopy">
            <strong>Planeamento de férias</strong>
            <small>Sugestões, calendário e simulação</small>
          </span>
          <span className="vacationWorkspaceTabArrow" aria-hidden="true">↗</span>
        </NavLink>
      </nav>

      {planning ? <h1 className="vacationWorkspaceScreenReaderTitle">Planeamento de férias</h1> : null}
      {!planning ? (
        <button className="vacationEvidenceJump" type="button" onClick={() => { focusSection('vacation-evidence-title') }}>
          Ver de onde vêm os dias registados ↓
        </button>
      ) : null}
      <div className="vacationWorkspacePane">
        <VacationBalancePage />
        {!planning ? <VacationEvidencePanel /> : null}
      </div>
    </div>
  )
}
