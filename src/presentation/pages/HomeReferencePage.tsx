import { Link } from 'react-router-dom'
import { TodayReferencePage } from './TodayReferencePage'

function QuickIcon({ type }: { type: 'calendar' | 'notifications' | 'reports' | 'medication' }) {
  if (type === 'calendar') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>
  }
  if (type === 'notifications') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5a5.5 5.5 0 0 1 11 0v3.2l1.5 2.8H5l1.5-2.8z"/><path d="M9.5 18a2.8 2.8 0 0 0 5 0"/></svg>
  }
  if (type === 'reports') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.3 18.7 18.7 8.3a4 4 0 0 0-5.7-5.7L2.6 13a4 4 0 0 0 5.7 5.7Z"/><path d="m8.5 7.5 8 8"/></svg>
}

export function HomeReferencePage() {
  return (
    <div className="homeReferenceShell">
      <TodayReferencePage />

      <section className="homeQuickAccess" aria-labelledby="home-quick-access-title">
        <h2 id="home-quick-access-title">Acesso rápido</h2>
        <nav aria-label="Acesso rápido do Início">
          <Link to="/calendario">
            <span className="homeQuickIcon"><QuickIcon type="calendar" /></span>
            <strong>Calendário</strong>
            <small>Plano + registos</small>
          </Link>
          <Link to="/notificacoes">
            <span className="homeQuickIcon"><QuickIcon type="notifications" /></span>
            <strong>Notificações</strong>
            <small>Estado + histórico</small>
          </Link>
          <Link to="/relatorios">
            <span className="homeQuickIcon"><QuickIcon type="reports" /></span>
            <strong>Relatórios</strong>
            <small>Semana + mês</small>
          </Link>
          <Link to="/medicamentos">
            <span className="homeQuickIcon"><QuickIcon type="medication" /></span>
            <strong>Medicação</strong>
            <small>Próxima toma</small>
          </Link>
        </nav>
      </section>
    </div>
  )
}
