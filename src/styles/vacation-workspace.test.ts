import { describe, expect, it } from 'vitest'
import workspaceCss from './vacation-workspace.css?raw'
import plannerCss from './vacation-planner.css?raw'
import plannerPage from '../presentation/pages/VacationPlannerPanel.tsx?raw'
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

  it('elimina altura artificial dos títulos quando o cabeçalho vira coluna no telemóvel', () => {
    const mobileHeaders = workspaceCss.slice(workspaceCss.indexOf('@media (max-width: 640px)'))
    expect(mobileHeaders).toContain('.vacationWorkspace.vacationWorkspace--overview .vacationAccrualPanel .vacationPanelHeader > div,')
    expect(mobileHeaders).toContain('.vacationWorkspace.vacationWorkspace--overview .vacationInsightsPanel .vacationPanelHeader > div {')
    expect(mobileHeaders).toContain('flex: 0 0 auto;')
    expect(mobileHeaders).toContain('width: 100%;')
    expect(mobileHeaders).not.toContain('flex-basis: 100%')
    expect(mobileHeaders).toContain('.vacationMonthCard > div:first-child {')
    expect(mobileHeaders).toContain('flex-wrap: wrap;')
    expect(mobileHeaders).toContain('.vacationMonthCard small + small { margin-top: 0; }')
  })

  it('mantém cabeçalho de planeamento compacto e estado visível sem transbordar', () => {
    expect(plannerPage).toContain('<header className="vacationPlannerHero">')
    expect(plannerPage).toContain('vacationPlannerHeroCopy')
    expect(plannerPage).toContain('vacationPlannerPreview')
    expect(plannerPage).toContain('Pré-visualização · sem guardar')
    expect(plannerCss).toContain('grid-template-columns: minmax(0, 1fr) minmax(0, 12.5rem)')
    expect(plannerCss).toContain('grid-auto-rows: min-content')
    expect(plannerCss).toContain('.vacationWorkspace--planning .vacationPage > .vacationPlannerPanel {')
    expect(plannerCss).toContain('flex-direction: column')
    expect(plannerCss).toContain('justify-content: flex-start')
    expect(plannerCss).toContain('flex: 0 0 auto')
    expect(plannerCss).toContain('overflow-wrap: anywhere')
    expect(plannerCss).toContain('@media (max-width: 820px)')
    expect(plannerCss).toContain('grid-template-columns: minmax(0, 1fr)')
  })
})
