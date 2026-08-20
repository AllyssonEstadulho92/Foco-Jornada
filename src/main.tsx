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
import './styles/tokens.css'
import './styles/global.css'
import './styles/journey.css'
import './styles/breaks.css'
import './styles/activities.css'
import './styles/focus.css'
import './styles/reports.css'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado.')

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
