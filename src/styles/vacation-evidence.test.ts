import { describe, expect, it } from 'vitest'
import evidence from '../presentation/pages/VacationEvidencePanel.tsx?raw'
import workspace from '../presentation/pages/VacationWorkspacePage.tsx?raw'
import css from './vacation-evidence.css?raw'
import layout from './vacation-evidence-layout.css?raw'

describe('detalhe de proveniência do saldo', () => {
  it('existe apenas na vista geral e não polui o planeamento', () => {
    expect(workspace).toContain('!planning ? <VacationEvidencePanel /> : null')
    expect(workspace).toContain('href="#vacation-evidence-title"')
    expect(workspace).toContain('<VacationBalancePage />')
    expect(workspace).not.toContain('calculateVacationBalance')
    expect(layout).toContain('.vacationWorkspace--overview .vacationWorkspacePane')
  })

  it('mostra fontes e datas só quando aberto e nunca escreve nem cria timers', () => {
    expect(evidence).toContain('collectVacationEvidenceForYear')
    expect(evidence).toContain('expanded ?')
    expect(evidence).toContain('aria-expanded={expanded}')
    expect(evidence).toContain('hidden={!expanded}')
    expect(evidence).toContain('Atualizar consulta')
    expect(evidence).toContain('Calculadora de horas')
    expect(evidence).toContain('Mapa de turnos')
    expect(evidence).toContain('Plano mensal')
    expect(evidence).toContain('Os dias gozados introduzidos manualmente não têm uma data associada')
    expect(evidence).not.toContain('setItem(')
    expect(evidence).not.toContain('setInterval(')
  })

  it('mantém contenção, leitura por teclado, contraste forçado e movimento reduzido', () => {
    expect(css).toContain('.vacationEvidenceBody[hidden] { display: none; }')
    expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr))')
    expect(css).toContain('overflow-wrap: anywhere')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('@media (max-width: 560px)')
    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
