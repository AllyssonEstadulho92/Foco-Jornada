import { describe, expect, it } from 'vitest'
import page from '../presentation/pages/MedicationsStockPage.tsx?raw'
import workspace from '../presentation/components/MedicationPrototypeWorkspace.tsx?raw'
import css from './medication-refinement.css?raw'
import main from '../main.tsx?raw'

describe('medicação — organização e acessibilidade', () => {
  it('mostra as tomas antes da lista, e a lista antes de configurações', () => {
    const doses = page.indexOf('className="stockPanel stockDosePanel medicationLinearToday"')
    const list = page.indexOf('<div id="medication-workspace"')
    const forecast = page.indexOf('className="medicationForecastDisclosure"')
    const settings = page.indexOf('id="medication-settings"')
    expect(doses).toBeGreaterThan(0)
    expect(list).toBeGreaterThan(doses)
    expect(forecast).toBeGreaterThan(list)
    expect(settings).toBeGreaterThan(forecast)
    expect(page).toContain('<nav className="medicationQuickNav" aria-label="Acesso rápido à medicação">')
  })

  it('mantém navegação por foco sem perturbar a rota hash', () => {
    expect(page).toContain("section.focus({ preventScroll: true })")
    expect(page).toContain("section.scrollIntoView({ block: 'start' })")
    expect(page).toContain('id="medication-today-doses" tabIndex={-1}')
    expect(page).toContain('<div id="medication-workspace" tabIndex={-1}>')
    expect(page).not.toContain('href="#medication-')
  })

  it('mantém as operações de tomas, horários e stock nos serviços originais', () => {
    expect(page).toContain('personalStockService.confirmMedicationDose(')
    expect(page).toContain('medicationDoseStatusService.confirmPostponedMedicationDose(')
    expect(page).toContain('personalStockService.endMedicationScheduleOnDate(')
    expect(page).toContain('stockReconciliationService.reconcileMedicationPhysicalCount(')
    expect(page).toContain('medicationDataProtectionService.syncRedundantSnapshot()')
    expect(page).toContain('<details className="medicationLinearAdvanced"')
  })

  it('agrupa informação adicional sem remover campos, pesquisa ou histórico', () => {
    expect(workspace).toContain('className="medProtoIntro"')
    expect(workspace).toContain('aria-label="Pesquisar medicamentos"')
    expect(workspace).toContain('aria-pressed={isSelected}')
    expect(workspace).toContain('<details className="medProtoAdditionalInfo">')
    expect(workspace).toContain('selectedProfile?.prescribedBy')
    expect(workspace).toContain('selectedProfile?.observation')
    expect(workspace).toContain("tab === 'history'")
    expect(workspace).toContain("tab === 'information'")
  })

  it('usa uma camada de estilos isolada, responsiva e com foco visível', () => {
    expect(main).toContain("import './styles/medication-refinement.css'")
    expect(css).toContain('.medicationLinearPage')
    expect(css).toContain('.medicationQuickNav')
    expect(css).toContain('.medProtoAdditionalInfo')
    expect(css).toContain('@media (max-width: 700px)')
    expect(css).toContain('@media (max-width: 420px)')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})
