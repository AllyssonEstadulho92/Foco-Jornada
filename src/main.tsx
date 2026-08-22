import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { db } from './infrastructure/database/appDatabase'
import { DexieActivityRepository } from './infrastructure/repositories/DexieActivityRepository'
import { DexieBreakRepository } from './infrastructure/repositories/DexieBreakRepository'
import { DexieCoffeeRepository } from './infrastructure/repositories/DexieCoffeeRepository'
import { DexieFocusRepository } from './infrastructure/repositories/DexieFocusRepository'
import { DexieJourneyRepository } from './infrastructure/repositories/DexieJourneyRepository'
import { DexieSettingsRepository } from './infrastructure/repositories/DexieSettingsRepository'
import { App } from './presentation/App'
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

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado.')

installNumberInputNormalization()

function keepInstalledPwaCurrent() {
  if (!('serviceWorker' in navigator)) return

  let reloadingForUpdate = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForUpdate) return
    reloadingForUpdate = true
    window.location.reload()
  })

  void navigator.serviceWorker.ready
    .then((registration) => registration.update())
    .catch(() => {
      // A aplicação continua utilizável mesmo que a verificação de atualização falhe.
    })
}

keepInstalledPwaCurrent()

const services = {
  journeyRepository: new DexieJourneyRepository(db),
  breakRepository: new DexieBreakRepository(db),
  activityRepository: new DexieActivityRepository(db),
  focusRepository: new DexieFocusRepository(db),
  coffeeRepository: new DexieCoffeeRepository(db),
  settingsRepository: new DexieSettingsRepository(db),
}

createRoot(root).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
)
