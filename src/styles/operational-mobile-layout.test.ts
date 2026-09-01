import { describe, expect, it } from 'vitest'
import migrationCss from './page-migration-v121.css?raw'

describe('layout operacional mobile', () => {
  it('não força o calendário para uma largura maior que o viewport', () => {
    expect(migrationCss).not.toContain('min-width: 620px')
    expect(migrationCss).toContain('.opsCalendarGrid')
    expect(migrationCss).toContain('grid-template-columns: repeat(7, minmax(0, 1fr))')
  })

  it('permite que a tabela de relatórios caiba no viewport mobile', () => {
    expect(migrationCss).toContain('.opsTable {')
    expect(migrationCss).toContain('table-layout: fixed')
    expect(migrationCss).toContain('min-width: 0')
  })
})
