import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNextScheduleEvent, resolveWorkScheduleForDate } from '../../domain/journey/WorkSchedule'
import { formatDuration, toLocalDateKey } from '../../shared/utils/dateTime'
import { useDayReport } from '../hooks/useDayReport'
import { useNow } from '../hooks/useNow'
import { useSettingsController } from '../hooks/useSettingsController'
import { useAppServices } from '../providers/AppServicesProvider'
import { useNotificationStore } from '../store/useNotificationStore'
import { TodayReferencePage } from './TodayReferencePage'

export function TodayV2Page() {
  const services = useAppServices()
  const now = useNow(1000)
  const todayKey = toLocalDateKey(now)
  const { report } = useDayReport(todayKey)
  const { settings } = useSettingsController()
  const notifications = useNotificationStore((state) => state.notifications)
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
  const unread = notifications.filter((item) => !item.read).length
  const statusLabel = activeFocus ? 'Foco em curso' : activeJourney ? 'Jornada em curso' : 'Sem sessão ativa'

  const productivity = useMemo(() => {
    if (!report?.summary.effectiveMs) return 0
    return Math.min(100, Math.round((report.summary.focusMs / report.summary.effectiveMs) * 100))
  }, [report])

  return (
    <>
      <section className="todayV2Overview" aria-label="Resumo operacional de hoje">
        <header className="todayV2Header">
          <div>
            <span className="opsEyebrow">HOJE V2</span>
            <strong>{statusLabel}</strong>
            <small>{resolvedSchedule.isWorkingDay ? `Plano ${resolvedSchedule.startTime}–${resolvedSchedule.endTime}` : 'Sem jornada planeada para hoje'}</small>
          </div>
          <div className="todayV2Next">
            <span>PRÓXIMO</span>
            <strong>{nextEvent.time ?? '—'}</strong>
            <small>{nextEvent.label}</small>
          </div>
        </header>

        <div className="todayV2Metrics">
          <article><span>Efetivo</span><strong>{formatDuration(report?.summary.effectiveMs ?? 0)}</strong><small>Tempo real</small></article>
          <article><span>Pausas</span><strong>{formatDuration(report?.summary.breakMs ?? 0)}</strong><small>Registadas</small></article>
          <article><span>Foco</span><strong>{formatDuration(report?.summary.focusMs ?? 0)}</strong><small>{productivity}% do efetivo</small></article>
          <article><span>Atividades</span><strong>{report?.summary.activityCount ?? 0}</strong><small>Concluídas</small></article>
          <article><span>Notificações</span><strong>{unread}</strong><small>Não lidas</small></article>
        </div>

        <nav className="todayV2QuickLinks" aria-label="Atalhos operacionais">
          <Link to="/calendario"><span>Calendário</span><strong>Plano + registos</strong></Link>
          <Link to="/notificacoes"><span>Notificações</span><strong>Estado + histórico</strong></Link>
          <Link to="/relatorios"><span>Relatórios</span><strong>Semana + mês</strong></Link>
          <Link to="/medicamentos"><span>Medicação</span><strong>Próxima toma programada</strong></Link>
        </nav>
      </section>
      <TodayReferencePage />
    </>
  )
}
