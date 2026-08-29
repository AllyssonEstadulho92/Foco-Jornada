import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppBackupService } from './application/data/AppBackupService'
import { MedicationDataProtectionService } from './application/personalStock/MedicationDataProtectionService'
import { MedicationDoseStatusService } from './application/personalStock/MedicationDoseStatusService'
import { NicotineAwarenessService } from './application/personalStock/NicotineAwarenessService'
import { OperationalPersonalStockService } from './application/personalStock/OperationalPersonalStockService'
import { StickDataProtectionService } from './application/personalStock/StickDataProtectionService'
import { StickPackPlannerService } from './application/personalStock/StickPackPlannerService'
import { StickUsageAnalyticsService } from './application/personalStock/StickUsageAnalyticsService'
import { StockReconciliationService } from './application/personalStock/StockReconciliationService'
import { db } from './infrastructure/database/appDatabase'
import { DexieActivityRepository } from './infrastructure/repositories/DexieActivityRepository'
import { DexieBreakRepository } from './infrastructure/repositories/DexieBreakRepository'
import { DexieCoffeeRepository } from './infrastructure/repositories/DexieCoffeeRepository'
import { DexieFocusRepository } from './infrastructure/repositories/DexieFocusRepository'
import { DexieJourneyRepository } from './infrastructure/repositories/DexieJourneyRepository'
import { DexieSettingsRepository } from './infrastructure/repositories/DexieSettingsRepository'
import { App } from './presentation/App'
import { installGloSessionPrototypeEnhancement } from './presentation/utils/installGloSessionPrototypeEnhancement'
import { installTodayScheduleMenuReveal } from './presentation/utils/installTodayScheduleMenuReveal'
import { installNumberInputNormalization } from './shared/utils/numberInput'
import './styles/tokens.css'
import './styles/global.css'
import './styles/journey.css'
import './styles/breaks.css'
import './styles/activities.css'
import './styles/focus.css'
import './styles/reports.css'
import './styles/history.css'
import './styles/prototype.css'
import './styles/today-dashboard.css'
import './styles/work-schedule.css'
import './styles/work-hours.css'
import './styles/work-hours-actions.css'
import './styles/guide.css'
import './styles/topbar.css'
import './styles/notifications.css'
import './styles/save-feedback.css'
import './styles/payroll.css'
import './styles/shift-map.css'
import './styles/more-redesign.css'
import './styles/today-modern.css'
import './styles/mobile-shell.css'
import './styles/today-reference.css'
import './styles/icon-refinement.css'
import './styles/mobile-fit.css'
import './styles/prototype-v2.css'
import './styles/prototype-v2-settings.css'
import './styles/reference-home.css'
import './styles/today-live-status.css'
import './styles/reference-settings.css'
import './styles/settings-button-reset.css'
import './styles/reference-finance.css'
import './styles/settings-functional.css'
import './styles/export-a4.css'
import './styles/personal-stock.css'
import './styles/dark-contrast.css'
import './styles/theme-polish.css'
import './styles/stock-reconciliation.css'
import './styles/mobile-collapse-scope.css'
import './styles/mobile-quick-access.css'
import './styles/personal-stock-hub-prototype.css'
import './styles/nicotine-awareness.css'
import './styles/stock-integrity-console.css'
import './styles/medication-protection.css'
import './styles/medication-prototype-complete.css'
import './styles/sticks-control-v2.css'
import './styles/glo-session-prototype.css'
import './styles/glo-session-digital-counter.css'
import './styles/sticks-pacing-reference.css'
import './styles/compact-time-displays.css'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado.')

installNumberInputNormalization()
installTodayScheduleMenuReveal()
installGloSessionPrototypeEnhancement()

function requestPwaUpdate() {
  if (!('serviceWorker' in navigator) || !navigator.onLine) return
  void navigator.serviceWorker.ready
    .then((registration) => registration.update())
    .catch(() => {
      // Uma falha de rede não impede o uso da versão já instalada.
    })
}

function keepInstalledPwaCurrent() {
  if (!('serviceWorker' in navigator)) return

  let reloadingForUpdate = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForUpdate) return
    reloadingForUpdate = true
    window.location.reload()
  })

  requestPwaUpdate()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestPwaUpdate()
  })
  window.addEventListener('online', requestPwaUpdate)
  window.setInterval(requestPwaUpdate, 60 * 60 * 1000)
}

keepInstalledPwaCurrent()

const personalStockService = new OperationalPersonalStockService(db)

const services = {
  journeyRepository: new DexieJourneyRepository(db),
  breakRepository: new DexieBreakRepository(db),
  activityRepository: new DexieActivityRepository(db),
  focusRepository: new DexieFocusRepository(db),
  coffeeRepository: new DexieCoffeeRepository(db),
  settingsRepository: new DexieSettingsRepository(db),
  personalStockService,
  medicationDoseStatusService: new MedicationDoseStatusService(db),
  medicationDataProtectionService: new MedicationDataProtectionService(db),
  stockReconciliationService: new StockReconciliationService(db),
  nicotineAwarenessService: new NicotineAwarenessService(db),
  stickDataProtectionService: new StickDataProtectionService(db),
  stickPackPlannerService: new StickPackPlannerService(db),
  stickUsageAnalyticsService: new StickUsageAnalyticsService(db),
  backupService: new AppBackupService(db),
}

createRoot(root).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
)
