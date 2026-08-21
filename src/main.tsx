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
import './styles/guide.css'
import './styles/topbar.css'
import './styles/notifications.css'
import './styles/payroll.css'
import './styles/more-redesign.css'
import './styles/today-modern.css'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado.')

installNumberInputNormalization()

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

async function removeLegacyPwaRuntime() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }

    if ('caches' in window) {
      const keys = await window.caches.keys()
      await Promise.all(keys.map((key) => window.caches.delete(key)))
    }
  } catch {
    // A limpeza é auxiliar e nunca deve bloquear o arranque da aplicação.
  }
}

void removeLegacyPwaRuntime()
