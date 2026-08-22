import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AppTopBar } from '../components/AppTopBar'
import { NavigationIcon } from '../navigation/NavigationIcon'
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

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brandLockup${compact ? ' brandLockupCompact' : ''}`}>
      <img src="./logo-mark.svg" alt="" aria-hidden="true" />
      <span className="brandLockupText"><strong>Foco</strong> <em>Jornada</em></span>
    </div>
  )
}

const mobileMainNavigation: NavigationItem[] = [
  { label: 'Hoje', path: '/', icon: 'home', end: true },
  { label: 'Mapa de turnos', path: '/turnos', icon: 'activities' },
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
]

const mobileBottomNavigation: NavigationItem[] = [
  { label: 'Início', path: '/', icon: 'home', end: true },
  { label: 'Foco', path: '/foco', icon: 'focus' },
  { label: 'Relatórios', path: '/estatisticas', icon: 'stats' },
  { label: 'Perfil', path: '/definicoes', icon: 'settings' },
]

export function AppShell() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    const themeColor = theme === 'dark' ? '#090c0b' : '#f7f8f6'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
  }, [theme])

  useEffect(() => {
    if (!mobileMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

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
      <a className="skipLink" href="#main-content">Saltar para o conteúdo</a>

      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brandRow">
          <BrandLockup compact={sidebarCollapsed} />
          {!sidebarCollapsed ? <span className="brandTagline">Produtividade com propósito</span> : null}
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
          {location.pathname === '/definicoes' ? (
            <section className="prototypeThemeCard" aria-label="Tema da aplicação">
              <div>
                <span>TEMA</span>
                <strong>Claro ou escuro</strong>
                <small>A escolha fica guardada neste dispositivo.</small>
              </div>
              <div className="prototypeThemeSegment" role="group" aria-label="Escolher tema">
                <button
                  type="button"
                  className={theme === 'light' ? 'prototypeThemeActive' : ''}
                  onClick={() => setTheme('light')}
                  aria-pressed={theme === 'light'}
                >
                  Claro
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'prototypeThemeActive' : ''}
                  onClick={() => setTheme('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  Escuro
                </button>
              </div>
            </section>
          ) : null}
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
          <BrandLockup />
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">×</button>
        </header>
        <p className="mobileDrawerTagline">Organiza o teu tempo, jornada e vencimento.</p>

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
            <span className="navLabel">Ajuda e suporte</span>
          </NavLink>
        </nav>

        <footer className="mobileDrawerFooter">
          <button className="drawerThemeToggle" type="button" onClick={toggleTheme}>
            <span>Tema</span>
            <strong>{theme === 'light' ? 'Claro' : 'Escuro'}</strong>
          </button>
          <span>Versão <strong>V1</strong></span>
        </footer>
      </aside>

      <nav className="bottomNav mobileBottomBar" aria-label="Navegação móvel">
        {mobileBottomNavigation.map((item) => (
          <NavigationLink key={`${item.path}-${item.label}`} item={item} />
        ))}
      </nav>
    </div>
  )
}
