import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AppTopBar } from '../components/AppTopBar'
import { NavigationIcon } from '../navigation/NavigationIcon'
import {
  mobileBottomNavigation,
  mobileDataNavigation,
  mobileMainNavigation,
  mobileQuickNavigation,
  primaryNavigation,
  secondaryNavigation,
  type NavigationItem,
} from '../navigation/navigationItems'
import { useUiStore } from '../store/useUiStore'

type ResolvedTheme = 'light' | 'dark'

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

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

const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.1.0'

export function AppShell() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const toggleTheme = useUiStore((state) => state.toggleTheme)
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileQuickOpen, setMobileQuickOpen] = useState(false)
  const [deviceTheme, setDeviceTheme] = useState<ResolvedTheme>(systemTheme)
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const mobileDrawerCloseRef = useRef<HTMLButtonElement | null>(null)
  const wasMobileMenuOpenRef = useRef(false)
  const resolvedTheme: ResolvedTheme = theme === 'system' ? deviceTheme : theme

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileQuickOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = () => setDeviceTheme(media.matches ? 'dark' : 'light')
    syncTheme()
    media.addEventListener('change', syncTheme)
    return () => media.removeEventListener('change', syncTheme)
  }, [])

  useEffect(() => {
    if (!navigator.storage?.persisted || !navigator.storage?.persist) return
    void navigator.storage.persisted()
      .then((persistent) => {
        if (!persistent) return navigator.storage.persist()
        return true
      })
      .catch(() => {
        // A aplicação continua com IndexedDB mesmo quando o navegador não permite persistência explícita.
      })
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
    const themeColor = resolvedTheme === 'dark' ? '#070a08' : '#f7f8f6'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
    document
      .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      ?.setAttribute('content', resolvedTheme === 'dark' ? 'black-translucent' : 'default')
  }, [resolvedTheme])

  useEffect(() => {
    if (!mobileMenuOpen && !mobileQuickOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMobileMenuOpen(false)
      setMobileQuickOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, mobileQuickOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (mobileMenuOpen) {
      wasMobileMenuOpenRef.current = true
      window.requestAnimationFrame(() => mobileDrawerCloseRef.current?.focus())
      return
    }

    if (wasMobileMenuOpenRef.current) {
      wasMobileMenuOpenRef.current = false
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
    }
  }, [mobileMenuOpen])

  const openMobileMenu = () => {
    setMobileQuickOpen(false)
    setMobileMenuOpen(true)
  }

  const toggleMobileQuickMenu = () => {
    setMobileMenuOpen(false)
    setMobileQuickOpen((open) => !open)
  }

  return (
    <div className={`appShell${sidebarCollapsed ? ' appShellCollapsed' : ''}${mobileMenuOpen ? ' appShellMobileMenuOpen' : ''}`}>
      <a className="skipLink" href="#main-content">Saltar para o conteúdo</a>

      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brandRow">
          <BrandLockup compact={sidebarCollapsed} />
          {!sidebarCollapsed ? <span className="brandTagline">Tempo, foco e jornada</span> : null}
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
        <AppTopBar onOpenMenu={openMobileMenu} menuButtonRef={mobileMenuButtonRef} />
        <main className="appContent" id="main-content" tabIndex={-1}>
          {location.pathname === '/definicoes' ? (
            <section className="prototypeThemeCard" aria-label="Tema da aplicação">
              <div>
                <span>TEMA</span>
                <strong>Escolhe a aparência</strong>
                <small>Sistema acompanha automaticamente o tema claro ou escuro do telemóvel.</small>
              </div>
              <div className="prototypeThemeSegment" role="group" aria-label="Escolher tema">
                <button
                  type="button"
                  className={theme === 'system' ? 'prototypeThemeActive' : ''}
                  onClick={() => setTheme('system')}
                  aria-pressed={theme === 'system'}
                >
                  Sistema
                </button>
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

      <aside id="mobile-main-drawer" className={`mobileDrawer${mobileMenuOpen ? ' mobileDrawerOpen' : ''}`} aria-label="Menu móvel" aria-hidden={!mobileMenuOpen} inert={!mobileMenuOpen}>
        <header className="mobileDrawerHeader">
          <BrandLockup />
          <button ref={mobileDrawerCloseRef} type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">×</button>
        </header>
        <p className="mobileDrawerTagline">Organiza tempo, foco, jornada e dados pessoais.</p>

        <section className="mobileDrawerQuickSection" aria-labelledby="mobile-quick-title">
          <div className="mobileDrawerSectionHeading">
            <span id="mobile-quick-title">Acesso rápido</span>
            <small>Principais</small>
          </div>
          <nav className="mobileDrawerQuickAccess" aria-label="Acesso rápido aos menus principais">
            {mobileQuickNavigation.map((item) => (
              <NavigationLink key={`quick-${item.path}-${item.label}`} item={item} />
            ))}
          </nav>
        </section>

        <div className="mobileDrawerSectionHeading mobileDrawerSectionHeadingSecondary">
          <span>Menu</span>
          <small>Outras áreas</small>
        </div>
        <nav className="mobileDrawerNav" aria-label="Navegação da aplicação">
          {mobileMainNavigation.map((item) => (
            <NavigationLink key={`${item.path}-${item.label}`} item={item} />
          ))}
        </nav>

        <div className="mobileDrawerDivider" />

        <nav className="mobileDrawerNav mobileDrawerTools" aria-label="Dados e ferramentas">
          {mobileDataNavigation.map((item) => (
            <StaticNavigationLink key={`${item.path}-${item.label}`} item={item} />
          ))}
        </nav>

        <div className="mobileDrawerDivider" />

        <nav className="mobileDrawerNav mobileDrawerSupport" aria-label="Ajuda">
          <NavLink to="/guia" className="navLink">
            <span className="navMark" aria-hidden="true"><NavigationIcon name="guide" /></span>
            <span className="navLabel">Ajuda</span>
          </NavLink>
        </nav>

        <footer className="mobileDrawerFooter">
          <button className="drawerThemeToggle" type="button" onClick={toggleTheme}>
            <span>Tema</span>
            <strong>
              {theme === 'system'
                ? `Sistema · ${resolvedTheme === 'dark' ? 'Escuro' : 'Claro'}`
                : theme === 'light' ? 'Claro' : 'Escuro'}
            </strong>
          </button>
          <span>Versão <strong>{appVersion}</strong></span>
        </footer>
      </aside>

      {mobileQuickOpen ? (
        <>
          <button
            className="mobileQuickBackdrop"
            type="button"
            aria-label="Fechar acessos rápidos"
            onClick={() => setMobileQuickOpen(false)}
          />
          <nav id="mobile-quick-panel" className="mobileQuickPanel" aria-labelledby="mobile-quick-panel-title">
            <header className="mobileQuickPanelHeader">
              <div className="mobileQuickPanelHeading">
                <span className="mobileQuickPanelHeadingIcon" aria-hidden="true">
                  <NavigationIcon name="more" />
                </span>
                <span className="mobileQuickPanelHeadingCopy">
                  <strong id="mobile-quick-panel-title">Acesso rápido</strong>
                  <span>Atalhos principais</span>
                </span>
              </div>
              <button
                className="mobileQuickPanelClose"
                type="button"
                onClick={() => setMobileQuickOpen(false)}
                aria-label="Fechar menu Mais"
              >
                ×
              </button>
            </header>
            {mobileQuickNavigation.map((item) => (
              <NavLink
                key={`panel-${item.path}-${item.label}`}
                to={item.path}
                className={({ isActive }) => `mobileQuickLink${isActive ? ' mobileQuickLinkActive' : ''}`}
              >
                <NavigationIcon name={item.icon} />
                <span className="mobileQuickLinkCopy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </NavLink>
            ))}
            <div className="mobileQuickPanelCallout">
              <span className="mobileQuickPanelCalloutIcon" aria-hidden="true">↯</span>
              <span>
                <strong>Tudo o que precisas, num só lugar.</strong>
                <small>Acede rapidamente às tuas ferramentas principais.</small>
              </span>
            </div>
          </nav>
        </>
      ) : null}

      <nav className="bottomNav mobileBottomBar" aria-label="Navegação móvel">
        <NavigationLink item={mobileBottomNavigation[0]} />
        <NavigationLink item={mobileBottomNavigation[1]} />
        <button
          className={`mobileQuickButton${mobileQuickOpen ? ' mobileQuickButtonActive' : ''}`}
          type="button"
          onClick={toggleMobileQuickMenu}
          aria-label={mobileQuickOpen ? 'Fechar menu Mais' : 'Abrir menu Mais'}
          aria-expanded={mobileQuickOpen}
          aria-controls="mobile-quick-panel"
        >
          <span className="mobileQuickButtonIcon" aria-hidden="true">+</span>
          <span className="mobileQuickButtonLabel">{mobileQuickOpen ? 'Fechar' : 'Mais'}</span>
        </button>
        <NavigationLink item={mobileBottomNavigation[2]} />
        <NavigationLink item={mobileBottomNavigation[3]} />
      </nav>
    </div>
  )
}
