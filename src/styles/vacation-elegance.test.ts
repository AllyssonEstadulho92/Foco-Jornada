import { describe, expect, it } from 'vitest'
import workspace from '../presentation/pages/VacationWorkspacePage.tsx?raw'
import balance from '../presentation/pages/VacationBalancePage.tsx?raw'
import elegance from './vacation-elegance.css?raw'

describe('refinamento visual de férias sem alterar os dados', () => {
  it('mantém as duas rotas reais e trata os registos como salto interno, sem alterar o hash', () => {
    expect(workspace).toContain('<NavLink to="/ferias" end')
    expect(workspace).toContain('<NavLink to="/ferias/planeamento"')
    expect(workspace).toContain('className="vacationWorkspaceToolbar"')
    expect(workspace).toContain('className="vacationEvidenceJump"')
    expect(workspace).toContain("focusSection('vacation-evidence-title')")
    expect(workspace).not.toContain('href="#vacation-evidence-title"')
    expect(workspace).toContain("import '../../styles/vacation-elegance.css'")
  })

  it('conserva o saldo calculado, o gráfico e a meta pessoal separados da referência laboral', () => {
    expect(balance).toContain('calculateVacationBalance({')
    expect(balance).toContain('balance.monthlyLiveAvailableBalanceDays')
    expect(balance).toContain('schedule={balance.monthlyAccrualSchedule}')
    expect(balance).toContain('annualEntitlementDays')
    expect(elegance).not.toContain('content: "22')
    expect(elegance).not.toContain('content: "28')
  })

  it('prevê 960, 540 e 355px, foco, alto contraste e movimento reduzido', () => {
    expect(elegance).toContain('@media (max-width: 960px)')
    expect(elegance).toContain('@media (max-width: 540px)')
    expect(elegance).toContain('@media (max-width: 355px)')
    expect(elegance).toContain(':focus-visible')
    expect(elegance).toContain('@media (forced-colors: active)')
    expect(elegance).toContain('@media (prefers-reduced-motion: reduce)')
    expect(elegance).toContain('.vacationEvidenceDay::before')
    expect(elegance).not.toContain('display: none')
  })
})
