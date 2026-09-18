// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import appShell from '../layouts/AppShell.tsx?raw'
import { focusSection } from './focusSection'

afterEach(() => {
  document.body.innerHTML = ''
  window.location.hash = '#/ferias'
  vi.restoreAllMocks()
})

describe('focusSection em createHashRouter', () => {
  it('mantém a rota, desloca a página e foca o título existente', () => {
    window.location.hash = '#/ferias'
    const heading = document.createElement('h2')
    heading.id = 'vacation-evidence-title'
    heading.tabIndex = -1
    const scrollIntoView = vi.fn()
    heading.scrollIntoView = scrollIntoView
    document.body.append(heading)

    expect(focusSection(heading.id)).toBe(true)
    expect(window.location.hash).toBe('#/ferias')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    expect(document.activeElement).toBe(heading)
  })

  it('não altera a rota quando o destino não existe', () => {
    window.location.hash = '#/ferias/planeamento'
    expect(focusSection('nao-existe')).toBe(false)
    expect(window.location.hash).toBe('#/ferias/planeamento')
  })

  it.each(['#/ferias', '#/ferias/planeamento', '#/turnos'])(
    'salta para o conteúdo principal sem perder a rota %s', (route) => {
      window.location.hash = route
      const main = document.createElement('main')
      main.id = 'main-content'
      main.tabIndex = -1
      const scrollIntoView = vi.fn()
      main.scrollIntoView = scrollIntoView
      document.body.append(main)

      expect(focusSection('main-content')).toBe(true)
      expect(window.location.hash).toBe(route)
      expect(document.activeElement).toBe(main)
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    },
  )

  it('usa um botão nativo com foco acessível e nunca uma âncora hash no AppShell', () => {
    expect(appShell).toContain('className="skipLink" type="button"')
    expect(appShell).toContain("focusSection('main-content')")
    expect(appShell).toContain('id="main-content" tabIndex={-1}')
    expect(appShell).not.toContain('href="#main-content"')
  })
})
