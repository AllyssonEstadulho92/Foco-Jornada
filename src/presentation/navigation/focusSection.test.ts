// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
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
})
