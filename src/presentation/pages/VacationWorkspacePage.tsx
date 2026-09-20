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
import '../../styles/vacation-month-visual.css'
import '../../styles/vacation-elegance.css'

type VacationWorkspaceView = 'overview' | 'planning'

/** Two distinct, directly linkable views of the same vacation data and calculations. */
export function VacationWorkspacePage({ view }: { view: VacationWorkspaceView }) {
  const planning = view === 'planning'

  return (
    <div className={`vacationWorkspace vacationWorkspace--${view}`}>
      <div className="vacationWorkspaceToolbar">
        <nav className="vacationWorkspaceNavigation" aria-label="Áreas das férias">
          <NavLink to="/ferias" end className={({ isActive }) => `vacationWorkspaceTab${isActive ? ' isActive' : ''}`}>
            <span className="vacationWorkspaceTabNumber" aria-hidden="true">01</span>
            <span className="vacationWorkspaceTabCopy">
              <strong>Visão geral</strong>
              <small>Meses, evolução e indicadores</small>
            </span>
            <span className="vacationWorkspaceTabArrow" aria-hidden="true">↗</span>
          </NavLink>
          <NavLink to="/ferias/planeamento" className={({ isActive }) => `vacationWorkspaceTab${isActive ? ' isActive' : ''}`}>
            <span className="vacationWorkspaceTabNumber" aria-hidden="true">02</span>
            <span className="vacationWorkspaceTabCopy">
              <strong>Planeamento</strong>
              <small>Sugestões, calendário e simulação</small>
            </span>
            <span className="vacationWorkspaceTabArrow" aria-hidden="true">↗</span>
          </NavLink>
        </nav>
        {!planning ? (
          <button className="vacationEvidenceJump" type="button" aria-label="Consultar dias de férias registados e respetivas fontes" onClick={() => { focusSection('vacation-evidence-title') }}>
            Registos <span aria-hidden="true">↓</span>
          </button>
        ) : null}
      </div>

      {planning ? <h1 className="vacationWorkspaceScreenReaderTitle">Planeamento de férias</h1> : null}
      <div className="vacationWorkspacePane">
        <VacationBalancePage />
        {!planning ? <VacationEvidencePanel /> : null}
      </div>
    </div>
  )
}
