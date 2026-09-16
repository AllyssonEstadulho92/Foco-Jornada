import { describe, expect, it } from 'vitest'
import workspaceCss from './vacation-workspace.css?raw'
import workspacePage from '../presentation/pages/VacationWorkspacePage.tsx?raw'
import vacationPage from '../presentation/pages/VacationBalancePage.tsx?raw'
import router from '../presentation/router.tsx?raw'

describe('férias — áreas separadas e responsivas', () => {
  it('mantém o resumo e cria uma rota de planeamento distinta, navegável por teclado', () => {
    expect(router).toContain("path: 'ferias', element: <VacationWorkspacePage view=\"overview\" />")
    expect(router).toContain("path: 'ferias/planeamento', element: <VacationWorkspacePage view=\"planning\" />")
    expect(workspacePage).toContain('aria-label="Áreas das férias"')
    expect(workspacePage).toContain('<NavLink to="/ferias" end')
    expect(workspacePage).toContain('<NavLink to="/ferias/planeamento"')
    expect(workspacePage).toContain('vacationWorkspaceScreenReaderTitle')
    expect(workspaceCss).toContain('.vacationWorkspaceTab:focus-visible')
  })

  it('apresenta mês a mês antes dos indicadores e remove o planeador da vista geral', () => {
    expect(workspaceCss).toContain('.vacationWorkspace--overview .vacationPlannerPanel { display: none; }')
    expect(workspaceCss).toContain('.vacationWorkspace--overview .vacationAccrualPanel { order: 3; }')
    expect(workspaceCss).toContain('.vacationWorkspace--overview .vacationInsightsPanel { order: 4; }')
    expect(vacationPage).toContain('Férias acumuladas mês a mês')
    expect(vacationPage).toContain('O que tens, o que falta e o que vem a seguir')
  })

  it('isola sugestões e simulação no planeamento sem duplicar agregação, cálculos ou escritas', () => {
    expect(workspaceCss).toContain('.vacationWorkspace--planning .vacationPage > :not(.vacationPlannerPanel) { display: none; }')
    expect(workspacePage).toContain('<VacationBalancePage />')
    expect(vacationPage).toContain('<VacationPlannerPanel')
    expect(workspacePage).not.toContain('secureStorage')
    expect(workspacePage).not.toContain('calculateVacationBalance')
    expect(workspacePage).not.toContain('setItem(')
  })

  it('controla largura, espaçamento, mobile, contraste e movimento reduzido', () => {
    expect(workspaceCss).toContain('width: min(100%, 80rem)')
    expect(workspaceCss).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr))')
    expect(workspaceCss).toContain('max-width: 100%')
    expect(workspaceCss).toContain('overflow-wrap: anywhere')
    expect(workspaceCss).toContain('@media (max-width: 560px)')
    expect(workspaceCss).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(workspaceCss).toContain('@media (forced-colors: active)')
    expect(workspaceCss).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
