import { describe, expect, it } from 'vitest'
import page from '../presentation/pages/MedicationsStockPage.tsx?raw'
import workspace from '../presentation/components/MedicationPrototypeWorkspace.tsx?raw'
import css from './medication-refinement.css?raw'

describe('Medicação: gestão do histórico sem apagar a auditoria', () => {
  it('apresenta ações explícitas e confirmação nas tomas programadas', () => {
    expect(page).toContain('className="medicationScheduleRowActions"')
    expect(page).toContain("openScheduleAction('define', schedule)")
    expect(page).toContain("openScheduleAction('delete', schedule)")
    expect(page).toContain('MedicationScheduleActionDialog')
  })

  it('agrupa o histórico por data e permite filtrar tipos de registos', () => {
    expect(workspace).toContain('function historyDay')
    expect(workspace).toContain('className="medHistoryDate"')
    expect(workspace).toContain('Tipo de registo')
    expect(workspace).toContain('<option value="dose">Tomas</option>')
    expect(workspace).toContain('<option value="schedule">Horários</option>')
    expect(workspace).toContain('<option value="stock">Stock</option>')
    expect(workspace).toContain('historyVisible')
  })

  it('mantém edições e anulações dos eventos como correções auditáveis', () => {
    expect(workspace).toContain('medicationDoseStatusService.replaceMedicationDoseStatus(')
    expect(workspace).toContain('medicationDoseStatusService.correctMedicationDoseStatus(')
    expect(workspace).toContain('personalStockService.undoMedicationDose(')
    expect(workspace).toContain('medicationDataProtectionService.recordCheckpoint(')
    expect(workspace).toContain('medicationDataProtectionService.syncRedundantSnapshot()')
    expect(workspace).toContain('activeHistoryDoseIds')
    expect(workspace).not.toContain('medicationDoseEvents.delete(')
  })

  it('usa a mesma gestão de horários com ativação no dia seguinte', () => {
    expect(workspace).toContain('personalStockService.defineMedicationScheduleFromDate(')
    expect(workspace).toContain('effectiveFrom: addCalendarDays(today, 1)')
    expect(workspace).toContain('personalStockService.endMedicationScheduleOnDate(')
    expect(workspace).toContain('effectiveUntil: today')
  })

  it('mantém ações acessíveis em ecrãs pequenos', () => {
    expect(css).toContain('.medHistoryActions')
    expect(css).toContain('.medHistoryDialogBackdrop')
    expect(css).toContain('.medicationScheduleRowActions')
    expect(css).toContain('@media(max-width: 620px)')
    expect(css).toContain(':focus-visible')
    expect(workspace).toContain('role="dialog"')
    expect(workspace).toContain('disabled={busy}')
  })
})
