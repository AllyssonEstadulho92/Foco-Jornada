import { useCallback, useEffect, useState } from 'react'
import { buildDayReport, type DayReport } from '../../application/reports/buildDayReport'
import { useAppServices } from '../providers/AppServicesProvider'

export function useDayReport(date: string) {
  const services = useAppServices()
  const [report, setReport] = useState<DayReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const next = await buildDayReport({
      journeyRepository: services.journeyRepository,
      breakRepository: services.breakRepository,
      activityRepository: services.activityRepository,
      focusRepository: services.focusRepository,
      coffeeRepository: services.coffeeRepository,
      date,
    })
    setReport(next)
  }, [date, services])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        setIsLoading(true)
        setError(null)
        await refresh()
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Erro ao gerar relatório diário.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  return { report, isLoading, error, refresh }
}
