import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AppTopBar } from '../components/AppTopBar'
import { BrandIcon, NavigationIcon } from '../navigation/NavigationIcon'
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

function StaticNavigationLink({ item }: { item: NavigationItem }) {
  return (
    <NavLink to={item.path} className="navLink">
      <span className="navMark" aria-hidden="true"><NavigationIcon name={item.icon} /></span>
      <span className="navLabel">{item.label}</span>
    </NavLink>
  )
}

const mobileMainNavigation: NavigationItem[] = [
  { label: 'Hoje', path: '/', icon: 'home', end: true },
  { label: 'Atividades', path: '/atividades', icon: 'activities' },
  { label: 'Histórico', path: '/historico', icon: 'history' },
  { label: 'Estatísticas', path: '/estatisticas', icon: 'stats' },
  { label: 'Calculadora de horas', path: '/horas', icon: 'hours' },
  { label: 'Vencimento', path: '/vencimento', icon: 'payroll' },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Guia', path: '/guia', icon: 'guide' },
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]

const mobileDataNavigation: NavigationItem[] = [
  { label: 'Diagnóstico do sistema', path: '/mais', icon: 'focus' },
  { label: 'Exportar dados', path: '/mais', icon: 'export' },
  { label: 'Importar dados', path: '/mais', icon: 'export' },
  { label: 'Cópia de segurança', path: '/mais', icon: 'more' },
  { label: 'Mais', path: '/mais', icon: 'more' },
]

const mobileBottomNavigation: NavigationItem[] = [
  { label: 'Hoje', path: '/', icon: 'home', end: true },
  { label: 'Histórico', path: '/historico', icon: 'history' },
  { label: 'Estatísticas', path: '/estatisticas', icon: 'stats' },
  { label: 'Definições', path: '/definicoes', icon: 'settings' },
]

export function AppShell() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
    setQuickMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!mobileMenuOpen && !quickMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMobileMenuOpen(false)
      setQuickMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, quickMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  return (
    <div className={`appShell${sidebarCollapsed ? ' appShellCollapsed' : ''}${mobileMenuOpen ? ' appShellMobileMenuOpen' : ''}`}>
      <a className="skipLink" href="#main-content">
        Saltar para o conteúdo
      </a>

      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brandRow">
          <div className="brandMark" aria-hidden="true">
            <BrandIcon />
          </div>
          <div className="brandCopy">
            <strong>Foco & Jornada</strong>
            <span>Produtividade com propósito</span>
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
          <span className="sidebarToggleIcon" aria-hidden="true">{sidebarCollapsed ? '→' : '←'}</span>
          <span className="navLabel">Recolher</span>
        </button>
      </aside>

      <div className="appMainArea">
        <AppTopBar onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="appContent" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <button
        className={`mobileDrawerBackdrop${mobileMenuOpen ? ' mobileDrawerBackdropVisible' : ''}`}
        type="button"
        aria-label="Fechar menu"
        tabIndex={mobileMenuOpen ? 0 : -1}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside className={`mobileDrawer${mobileMenuOpen ? ' mobileDrawerOpen' : ''}`} aria-label="Menu móvel" aria-hidden={!mobileMenuOpen}>
        <header className="mobileDrawerHeader">
          <div>
            <strong>Foco Jornada</strong>
            <span>Organiza o teu tempo.</span>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">×</button>
        </header>

        <nav className="mobileDrawerNav" aria-label="Navegação da aplicação">
          {mobileMainNavigation.map((item) => (
            <NavigationLink key={`${item.path}-${item.label}`} item={item} />
          ))}
        </nav>

        <div className="mobileDrawerDivider" />

        <nav className="mobileDrawerNav mobileDrawerTools" aria-label="Ferramentas e dados">
          {mobileDataNavigation.map((item) => (
            <StaticNavigationLink key={`${item.path}-${item.label}`} item={item} />
          ))}
        </nav>

        <div className="mobileDrawerDivider" />

        <nav className="mobileDrawerNav mobileDrawerSupport" aria-label="Informação e apoio">
          <NavLink to="/guia" className="navLink">
            <span className="navMark" aria-hidden="true"><NavigationIcon name="guide" /></span>
            <span className="navLabel">Sobre a aplicação</span>
          </NavLink>
          <NavLink to="/guia" className="navLink">
            <span className="navMark" aria-hidden="true"><NavigationIcon name="guide" /></span>
            <span className="navLabel">Ajuda e suporte</span>
          </NavLink>
        </nav>

        <footer className="mobileDrawerFooter">
          <span>Tema <strong>Claro</strong></span>
          <span>Versão <strong>1.0.0</strong></span>
        </footer>
      </aside>

      {quickMenuOpen ? (
        <div className="mobileQuickPanel" role="dialog" aria-label="Ações rápidas">
          <NavLink to="/atividades"><NavigationIcon name="activities" /><span>Atividade</span></NavLink>
          <NavLink to="/foco"><NavigationIcon name="focus" /><span>Foco</span></NavLink>
          <NavLink to="/horas"><NavigationIcon name="hours" /><span>Horas</span></NavLink>
          <NavLink to="/vencimento"><NavigationIcon name="payroll" /><span>Vencimento</span></NavLink>
        </div>
      ) : null}

      <nav className="bottomNav mobileBottomBar" aria-label="Navegação móvel">
        <NavigationLink item={mobileBottomNavigation[0]} />
        <NavigationLink item={mobileBottomNavigation[1]} />
        <button
          className={`mobileQuickButton${quickMenuOpen ? ' mobileQuickButtonActive' : ''}`}
          type="button"
          onClick={() => setQuickMenuOpen((current) => !current)}
          aria-label={quickMenuOpen ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
          aria-expanded={quickMenuOpen}
        >
          <span aria-hidden="true">+</span>
        </button>
        <NavigationLink item={mobileBottomNavigation[2]} />
        <NavigationLink item={mobileBottomNavigation[3]} />
      </nav>
    </div>
  )
}
