import { Link } from 'react-router-dom'
import { AppIcon } from '../components/ui/AppIcon'
import { SectionHeader } from '../components/ui/UiPrimitives'
import { TodayReferencePage } from './TodayReferencePage'

function QuickIcon({ type }: { type: 'calendar' | 'notifications' | 'reports' | 'medication' }) {
  if (type === 'calendar') return <AppIcon name="calendar" />
  if (type === 'notifications') return <AppIcon name="bell" />
  if (type === 'reports') return <AppIcon name="stats" />
  return <AppIcon name="medication" />
}

export function HomeReferencePage() {
  return (
    <div className="homeReferenceShell">
      <TodayReferencePage />

      <section className="homeQuickAccess" aria-labelledby="home-quick-access-title">
        <SectionHeader
          id="home-quick-access-title"
          title="Acesso rápido"
          description="Áreas principais sem duplicar informação do dashboard."
        />
        <nav aria-label="Acesso rápido do Início">
          <Link to="/calendario">
            <span className="homeQuickIcon"><QuickIcon type="calendar" /></span>
            <strong>Jornada</strong>
            <small>Calendário + registos</small>
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
