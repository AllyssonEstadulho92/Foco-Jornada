import { describe, expect, it } from 'vitest'
import operationalCss from './operational-suite-v1.css?raw'

describe('CSS operacional sem módulos removidos', () => {
  it('não volta a incluir estilos do TodayV2 removido', () => {
    expect(operationalCss).not.toContain('todayV2')
  })

  it('preserva os seletores operacionais usados por calendário e relatórios', () => {
    expect(operationalCss).toContain('.opsPage')
    expect(operationalCss).toContain('.opsCalendarGrid')
    expect(operationalCss).toContain('.opsTable')
    expect(operationalCss).toContain('.opsDayLinks')
  })
})
