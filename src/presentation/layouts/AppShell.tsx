import { NavLink, Outlet } from 'react-router-dom'
import { NavigationIcon } from '../components/NavigationIcon'
import { primaryNavigation, secondaryNavigation, type NavigationItem } from '../navigation/navigationItems'
import { useUiStore } from '../store/useUiStore'

function NavigationLink({ item, compact = false }: { item: NavigationItem; compact?: boolean }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) => `navLink${isActive ? ' navLinkActive' : ''}`}
      aria-label={compact ? item.label : undefined}
    >
      <span className="navMark" aria-hidden="true">
        <NavigationIcon name={item.icon} />
      </span>
      <span className="navLabel">{item.label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  return (
    <div className={`appShell${sidebarCollapsed ? ' appShellCollapsed' : ''}`}>
      <a className="skipLink" href="#main-content">
        Saltar para o conteúdo
      </a>

      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brandRow">
          <div className="brandMark" aria-hidden="true">FJ</div>
          <div className="brandCopy">
            <strong>Foco & Jornada</strong>
            <span>Produtividade pessoal</span>
          </div>
        </div>

        <nav className="sidebarNav">
          {primaryNavigation.map((item) => (
            <NavigationLink key={item.path} item={item} compact={sidebarCollapsed} />
          ))}
        </nav>

        <nav className="sidebarSecondary" aria-label="Navegação secundária">
          {secondaryNavigation.map((item) => (
            <NavigationLink key={item.path} item={item} compact={sidebarCollapsed} />
          ))}
        </nav>

        <button
          className="sidebarToggle"
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          <span aria-hidden="true">{sidebarCollapsed ? '→' : '←'}</span>
          <span className="navLabel">Recolher</span>
        </button>
      </aside>

      <main className="appContent" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <nav className="bottomNav" aria-label="Navegação móvel">
        {primaryNavigation.map((item) => (
          <NavigationLink key={item.path} item={item} />
        ))}
      </nav>
    </div>
  )
}
