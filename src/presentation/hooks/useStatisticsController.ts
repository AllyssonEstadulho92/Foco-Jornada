import { useEffect, useMemo, useState } from 'react'
import { buildDayReport, type DayReport } from '../../application/reports/buildDayReport'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'

export type StatisticsPeriod = 'day' | 'week' | 'month'

function dateKeysFor(period: StatisticsPeriod, reference: Date): string[] {
  const count = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const dates: string[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(reference)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    dates.push(toLocalDateKey(date))
  }
  return dates
}

export function useStatisticsController(period: StatisticsPeriod) {
  const services = useAppServices()
  const [reports, setReports] = useState<DayReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        setIsLoading(true)
        setError(null)
        const reports = await Promise.all(
          dateKeysFor(period, new Date()).map((date) =>
            buildDayReport({
              journeyRepository: services.journeyRepository,
              breakRepository: services.breakRepository,
              activityRepository: services.activityRepository,
              focusRepository: services.focusRepository,
              coffeeRepository: services.coffeeRepository,
              date,
            }),
          ),
        )
        if (!cancelled) setReports(reports)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Erro ao calcular estatísticas.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [period, services])

  const totals = useMemo(
    () =>
      reports.reduce(
        (acc, report) => ({
          journeyMs: acc.journeyMs + report.summary.journeyMs,
          effectiveMs: acc.effectiveMs + report.summary.effectiveMs,
          breakMs: acc.breakMs + report.summary.breakMs,
          focusMs: acc.focusMs + report.summary.focusMs,
          activityCount: acc.activityCount + report.summary.activityCount,
          coffeeCount: acc.coffeeCount + report.summary.coffeeCount,
          coffeeCost: Math.round((acc.coffeeCost + report.summary.coffeeCost) * 100) / 100,
        }),
        { journeyMs: 0, effectiveMs: 0, breakMs: 0, focusMs: 0, activityCount: 0, coffeeCount: 0, coffeeCost: 0 },
      ),
    [reports],
  )

  return { reports, totals, isLoading, error }
}
