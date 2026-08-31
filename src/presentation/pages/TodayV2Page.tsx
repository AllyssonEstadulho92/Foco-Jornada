import { useEffect, useState } from 'react'
import { getNextScheduleEvent, resolveWorkScheduleForDate } from '../../domain/journey/WorkSchedule'
import { formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useDayReport } from '../hooks/useDayReport'
import { useNow } from '../hooks/useNow'
import { useSettingsController } from '../hooks/useSettingsController'
import { useAppServices } from '../providers/AppServicesProvider'
import { TodayReferencePage } from './TodayReferencePage'

export function TodayV2Page() {
  const services = useAppServices()
  const now = useNow(1000)
  const todayKey = toLocalDateKey(now)
  const { report } = useDayReport(todayKey)
  const { settings } = useSettingsController()
  const [activeJourney, setActiveJourney] = useState(false)
  const [activeFocus, setActiveFocus] = useState(false)

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const journey = await services.journeyRepository.getActive()
      if (cancelled) return
      setActiveJourney(Boolean(journey))
      if (!journey) {
        setActiveFocus(false)
        return
      }
      const focus = await services.focusRepository.getOpenForJourney(journey.id)
      if (!cancelled) setActiveFocus(Boolean(focus))
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 15000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [services.focusRepository, services.journeyRepository])

  const resolvedSchedule = resolveWorkScheduleForDate(settings.workSchedule, now)
  const nextEvent = getNextScheduleEvent(settings.workSchedule, now)
  const statusLabel = activeFocus ? 'Foco em curso' : activeJourney ? 'Jornada em curso' : 'Sem sessão ativa'

  return (
    <>
      <section className="todayV2Overview" aria-label="Resumo de hoje">
        <header className="todayV2Header">
          <div>
            <span className="opsEyebrow">HOJE</span>
            <strong>{statusLabel}</strong>
            <small>{resolvedSchedule.isWorkingDay ? `Plano ${resolvedSchedule.startTime}–${resolvedSchedule.endTime}` : 'Sem jornada planeada para hoje'}</small>
          </div>
          <div className="todayV2Next">
            <span>PRÓXIMO</span>
            <strong>{nextEvent.time ?? '—'}</strong>
            <small>{nextEvent.label}</small>
          </div>
        </header>

        <div className="todayV2Metrics" aria-label="Indicadores principais do dia">
          <article><span>Efetivo</span><strong>{formatDuration(report?.summary.effectiveMs ?? 0)}</strong><small>Tempo real</small></article>
          <article><span>Pausas</span><strong>{formatDuration(report?.summary.breakMs ?? 0)}</strong><small>Registadas</small></article>
          <article><span>Foco</span><strong>{formatDuration(report?.summary.focusMs ?? 0)}</strong><small>Tempo focado</small></article>
        </div>
      </section>
      <TodayReferencePage />
    </>
  )
}
