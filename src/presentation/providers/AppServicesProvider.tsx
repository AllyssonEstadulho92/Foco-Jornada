/* eslint-disable react-refresh/only-export-components -- o provider e o hook pertencem ao mesmo contexto de serviços. */
import { createContext, type ReactNode, useContext } from 'react'
import type { ActivityRepository } from '../../application/activities/ActivityRepository'
import type { BreakRepository } from '../../application/breaks/BreakRepository'
import type { CoffeeRepository } from '../../application/coffee/CoffeeRepository'
import type { FocusRepository } from '../../application/focus/FocusRepository'
import type { JourneyRepository } from '../../application/journey/JourneyRepository'
import type { SettingsRepository } from '../../application/settings/SettingsRepository'

export interface AppServices {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
  coffeeRepository: CoffeeRepository
  settingsRepository: SettingsRepository
}

const AppServicesContext = createContext<AppServices | null>(null)

export function AppServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext)
  if (!services) throw new Error('AppServicesProvider não foi configurado.')
  return services
}
