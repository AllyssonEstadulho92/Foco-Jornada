import { buildDayReport } from '../../application/reports/buildDayReport'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import type { AppServices } from '../providers/AppServicesProvider'

export async function downloadDayData(services: AppServices, date = toLocalDateKey(new Date())) {
  const report = await buildDayReport({
    journeyRepository: services.journeyRepository,
    breakRepository: services.breakRepository,
    activityRepository: services.activityRepository,
    focusRepository: services.focusRepository,
    coffeeRepository: services.coffeeRepository,
    date,
  })

  const payload = {
    format: 'foco-jornada-day-backup',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion: __APP_VERSION__,
    buildId: __APP_BUILD_ID__,
    ...report,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `foco-jornada-dados-${date}.json`
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)

  return report
}
