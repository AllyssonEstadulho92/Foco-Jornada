import { createContext, type ReactNode, useContext } from 'react'
import type { ActivityRepository } from '../../application/activities/ActivityRepository'
import type { BreakRepository } from '../../application/breaks/BreakRepository'
import type { FocusRepository } from '../../application/focus/FocusRepository'
import type { JourneyRepository } from '../../application/journey/JourneyRepository'

export interface AppServices {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  activityRepository: ActivityRepository
  focusRepository: FocusRepository
}

const AppServicesContext = createContext<AppServices | null>(null)

export function AppServicesProvider({
  services,
  children,
}: {
  services: AppServices
  children: ReactNode
}) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext)

  if (!services) {
    throw new Error('AppServicesProvider não foi configurado.')
  }

  return services
}
