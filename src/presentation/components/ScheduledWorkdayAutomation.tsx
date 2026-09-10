import { useEffect, useRef } from 'react'
import { reconcileScheduledWorkday } from '../../application/journey/reconcileScheduledWorkday'
import { notifyAppDataChanged } from '../events/appDataChanged'
import { useNow } from '../hooks/useNow'
import { useAppServices } from '../providers/AppServicesProvider'

export function ScheduledWorkdayAutomation() {
  const services = useAppServices()
  const now = useNow(5_000)
  const runningRef = useRef(false)

  useEffect(() => {
    if (runningRef.current) return
    runningRef.current = true

    void reconcileScheduledWorkday({
      journeyRepository: services.journeyRepository,
      breakRepository: services.breakRepository,
      activityRepository: services.activityRepository,
      focusRepository: services.focusRepository,
      settingsRepository: services.settingsRepository,
      now: () => now,
    })
      .then((actions) => {
        if (actions.length > 0) notifyAppDataChanged()
      })
      .catch((error: unknown) => {
        console.error('Falha ao reconciliar automaticamente a jornada planeada.', error)
      })
      .finally(() => {
        runningRef.current = false
      })
  }, [now, services])

  return null
}
