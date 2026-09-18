import { describe, expect, it } from 'vitest'
import polish from './vacation-visual-audit.css?raw'
import workspace from '../presentation/pages/VacationWorkspacePage.tsx?raw'
import workspaceCss from './vacation-workspace.css?raw'
import balance from '../presentation/pages/VacationBalancePage.tsx?raw'

describe('auditoria visual das férias', () => {
  it('aplica a camada às duas rotas sem alterar cálculo, cofre ou saltos hash', () => {
    expect(workspace).toContain("import '../../styles/vacation-visual-audit.css'")
    expect(workspace).toContain("focusSection('vacation-evidence-title')")
    expect(workspace).not.toContain('href="#vacation-evidence-title"')
    expect(polish).toContain('.vacationWorkspace--overview')
    expect(polish).toContain('.vacationWorkspace--planning')
    expect(polish).not.toContain('.vacationPlannerPanel { display: none; }')
    expect(balance).toContain('calculateVacationBalance(')
    expect(workspace).not.toContain('secureStorage')
  })

  it('mantém as três áreas organizadas e o planeamento isolado', () => {
    expect(workspaceCss).toContain('.vacationWorkspace--overview .vacationAccrualPanel { order: 3; }')
    expect(workspaceCss).toContain('.vacationWorkspace--overview .vacationInsightsPanel { order: 4; }')
    expect(workspaceCss).toContain('.vacationWorkspace--overview .vacationPlannerPanel { display: none; }')
    expect(workspaceCss).toContain('.vacationWorkspace--planning .vacationPage > :not(.vacationPlannerPanel) { display: none; }')
    expect(polish).toContain('.vacationWorkspace .vacationPanelHeader h2')
  })

  it('tem navegação móvel compacta, conteúdo contido e alvos de toque acessíveis', () => {
    expect(polish).toContain('@media (max-width: 560px)')
    expect(polish).toContain('@media (max-width: 360px)')
    expect(polish).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(polish).toContain('min-height: 44px')
    expect(polish).toContain('.vacationWorkspace .vacationWorkspaceTabCopy small { display: none; }')
    expect(workspaceCss).toContain('overflow-wrap: anywhere')
    expect(polish).toContain('@media (forced-colors: active)')
    expect(polish).toContain('@media (prefers-reduced-motion: reduce)')
    expect(workspaceCss).toContain('.vacationWorkspaceTab:focus-visible')
  })

  it('mantém superfícies legíveis, salientando o saldo sem esconder valores', () => {
    expect(polish).toContain('width: min(100%, 74rem)')
    expect(polish).toContain('.vacationWorkspace .vacationMetricPrimary:not(.vacationMetricDanger)')
    expect(polish).toContain('.vacationWorkspace .vacationMetricCard strong')
    expect(polish).toContain('font-variant-numeric: tabular-nums')
    expect(polish).toContain('.vacationWorkspace .vacationPlannerPreview')
    expect(polish).not.toContain('visibility: hidden')
  })

  it('preserva sete colunas e evita larguras mínimas que empurrem calendários para fora do ecrã', () => {
    expect(polish).toContain('.vacationWorkspace--planning .vacationSuggestCalendarGrid')
    expect(polish).toContain('.vacationWorkspace--planning .vacationJointCalendarGrid')
    expect(polish).toContain('grid-template-columns: repeat(7, minmax(0, 1fr))')
    expect(polish).toContain('.vacationWorkspace--planning .vacationSuggestDay')
    expect(polish).toContain('padding-inline: 0')
    expect(polish).toContain('gap: .12rem')
  })
})
