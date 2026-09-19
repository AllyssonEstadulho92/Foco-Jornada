import { describe, expect, it } from 'vitest'
import planner from '../presentation/pages/VacationPlannerPanel.tsx?raw'
import joint from '../presentation/pages/VacationJointPlanner.tsx?raw'
import checklist from '../presentation/pages/VacationConfirmationChecklist.tsx?raw'
import workspace from '../presentation/pages/VacationWorkspacePage.tsx?raw'
import structure from './vacation-planning-structure.css?raw'

describe('estrutura do planeamento de férias', () => {
  it('coloca propostas do ano seguinte antes do saldo atual e mantém-no consultável', () => {
    const futureBranch = planner.slice(planner.indexOf('{shownYear === currentYear + 1 ? ('))
    expect(futureBranch.indexOf('<VacationJointPlanner')).toBeLessThan(futureBranch.indexOf('<details className="vacationPlannerContext"'))
    expect(futureBranch).toContain('Referência de {currentYear}, não saldo transferido para {shownYear}.')
    expect(futureBranch).toContain('liveBalance.monthlyLiveAvailableBalanceDays')
    expect(futureBranch).toContain('{liveSummary}')
    expect(planner).toContain('{liveSummary}\n          <VacationSuggestionsPanel')
    expect(planner).toContain('calculateVacationBalance({')
    expect(planner).not.toContain('setInterval(')
  })

  it('mantém as decisões num percurso de quatro etapas e os esclarecimentos acessíveis', () => {
    expect(joint).toContain('01 · ESCOLHER')
    expect(joint).toContain('02 · COMPARAR')
    expect(joint).toContain('03 · SIMULAR')
    expect(checklist).toContain('04 · CONFIRMAR ANTES DE MARCAR')
    expect(joint).toContain('<details className="vacationJointMethod">')
    expect(joint).toContain('Estimativa, não direito adquirido.')
    expect(joint).toContain('BLOCKED_MONTHS = [11, 12] as const')
    expect(joint).toContain('key={confirmationScope}')
    expect(joint).not.toContain('setItem(')
    expect(checklist).not.toContain('setItem(')
  })

  it('contém cartões, filtros e calendário e preserva a versão de uma coluna', () => {
    expect(workspace).toContain("import '../../styles/vacation-planning-structure.css'")
    expect(structure).toContain('.vacationWorkspace--planning .vacationPlannerContext')
    expect(structure).toContain('.vacationWorkspace--planning .vacationJointOptions')
    expect(structure).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(structure).toContain('@media (max-width: 720px)')
    expect(structure).toContain('@media (max-width: 440px)')
    expect(structure).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(structure).toContain('@media (forced-colors: active)')
    expect(structure).toContain('@media (prefers-reduced-motion: reduce)')
    expect(structure).not.toContain('.vacationJointOptions { display: none; }')
    expect(structure).not.toContain('overflow-x: hidden')
  })

  it('coloca escolher e comparar lado a lado apenas no desktop e contém o resumo no móvel', () => {
    expect(structure).toContain('@media (min-width: 1100px)')
    expect(structure).toContain('grid-template-columns: repeat(12, minmax(0, 1fr))')
    expect(structure).toContain('.vacationJointChoice { grid-column: span 4; }')
    expect(structure).toContain('.vacationJointCompare { grid-column: span 8; }')
    expect(structure).toContain('.vacationJointSimulation,')
    expect(structure).toContain('.vacationJointConfirmations,')
    expect(structure).toContain('grid-template-columns: minmax(0, 1fr) auto;')
    expect(structure).toContain('.vacationPlannerContext > summary > span:first-child { grid-column: 1 / -1; }')
    expect(structure).toContain('outline: 3px solid var(--primary)')
  })
})
