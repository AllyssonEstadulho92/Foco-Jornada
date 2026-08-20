import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { cancelFocusSession } from '../../application/focus/cancelFocusSession'
import { completeFocusSession } from '../../application/focus/completeFocusSession'
import { pauseFocusSession } from '../../application/focus/pauseFocusSession'
import { resumeFocusSession } from '../../application/focus/resumeFocusSession'
import { startFocusSession } from '../../application/focus/startFocusSession'
import {
  getNextPomodoroStep,
  type FocusSession,
  type PomodoroStep,
} from '../../domain/focus/FocusSession'
import { useAppServices } from '../providers/AppServicesProvider'

export function useFocusController(journeyId?: string) {
  const { journeyRepository, breakRepository, activityRepository, focusRepository } = useAppServices()
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [activeSession, setActiveSession] = useState<FocusSession | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!journeyId) {
      setSessions([])
      setActiveSession(undefined)
      return
    }

    const [records, open] = await Promise.all([
      focusRepository.listByJourney(journeyId),
      focusRepository.getOpenForJourney(journeyId),
    ])
    setSessions(records)
    setActiveSession(open)
  }, [focusRepository, journeyId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        await refresh()
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar as sessões de foco.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const latestCompletedPomodoro = useMemo(
    () =>
      sessions
        .slice()
        .reverse()
        .find((session) => session.mode === 'pomodoro' && session.status === 'completed'),
    [sessions],
  )

  const recommendedStep = useMemo(
    () => getNextPomodoroStep(latestCompletedPomodoro),
    [latestCompletedPomodoro],
  )

  const startPomodoro = useCallback(
    async (step: PomodoroStep = recommendedStep, activityId?: string) => {
      if (isBusy) return false
      try {
        setIsBusy(true)
        setError(null)
        const result = await startFocusSession({
          journeyRepository,
          breakRepository,
          activityRepository,
          focusRepository,
          mode: 'pomodoro',
          segmentType: step.segmentType,
          cycle: step.cycle,
          activityId,
        })
        await refresh()

        if (result.status === 'started') {
          toast.success('Sessão Pomodoro iniciada.')
          return true
        }
        if (result.status === 'break-active') toast.error('Termina a pausa da jornada antes de iniciar o foco.')
        else if (result.status === 'no-active-journey') toast.error('Inicia uma jornada antes da sessão de foco.')
        else if (result.status === 'activity-not-active') toast.error('A atividade associada já não está ativa.')
        else toast('Já existe uma sessão de foco aberta.')
        return false
      } catch (startError) {
        const message = startError instanceof Error ? startError.message : 'Erro ao iniciar a sessão.'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsBusy(false)
      }
    },
    [
      activityRepository,
      breakRepository,
      focusRepository,
      isBusy,
      journeyRepository,
      recommendedStep,
      refresh,
    ],
  )

  const startCustom = useCallback(
    async (minutes: number, activityId?: string) => {
      if (isBusy) return false
      const durationSeconds = Math.round(minutes * 60)
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        toast.error('Indica uma duração válida.')
        return false
      }

      try {
        setIsBusy(true)
        setError(null)
        const result = await startFocusSession({
          journeyRepository,
          breakRepository,
          activityRepository,
          focusRepository,
          mode: 'custom',
          plannedDurationSeconds: durationSeconds,
          activityId,
        })
        await refresh()

        if (result.status === 'started') {
          toast.success('Sessão personalizada iniciada.')
          return true
        }
        if (result.status === 'break-active') toast.error('Termina a pausa da jornada antes de iniciar o foco.')
        else if (result.status === 'no-active-journey') toast.error('Inicia uma jornada antes da sessão de foco.')
        else if (result.status === 'activity-not-active') toast.error('A atividade associada já não está ativa.')
        else toast('Já existe uma sessão de foco aberta.')
        return false
      } catch (startError) {
        const message = startError instanceof Error ? startError.message : 'Erro ao iniciar a sessão.'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsBusy(false)
      }
    },
    [activityRepository, breakRepository, focusRepository, isBusy, journeyRepository, refresh],
  )

  const pause = useCallback(async () => {
    if (isBusy || !journeyId) return
    try {
      setIsBusy(true)
      const result = await pauseFocusSession({ focusRepository, journeyId })
      await refresh()
      if (result.status === 'paused') toast('Sessão pausada.')
    } catch (pauseError) {
      const message = pauseError instanceof Error ? pauseError.message : 'Erro ao pausar a sessão.'
      setError(message)
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }, [focusRepository, isBusy, journeyId, refresh])

  const resume = useCallback(async () => {
    if (isBusy || !journeyId) return
    try {
      setIsBusy(true)
      const result = await resumeFocusSession({ focusRepository, journeyId })
      await refresh()
      if (result.status === 'resumed') toast.success('Sessão retomada.')
    } catch (resumeError) {
      const message = resumeError instanceof Error ? resumeError.message : 'Erro ao retomar a sessão.'
      setError(message)
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }, [focusRepository, isBusy, journeyId, refresh])

  const complete = useCallback(async () => {
    if (isBusy || !journeyId) return
    try {
      setIsBusy(true)
      const result = await completeFocusSession({ focusRepository, journeyId })
      await refresh()
      if (result.status === 'completed') toast.success('Sessão concluída.')
    } catch (completeError) {
      const message = completeError instanceof Error ? completeError.message : 'Erro ao concluir a sessão.'
      setError(message)
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }, [focusRepository, isBusy, journeyId, refresh])

  const cancel = useCallback(async () => {
    if (isBusy || !journeyId) return
    try {
      setIsBusy(true)
      const result = await cancelFocusSession({ focusRepository, journeyId })
      await refresh()
      if (result.status === 'cancelled') toast('Sessão cancelada.')
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : 'Erro ao cancelar a sessão.'
      setError(message)
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }, [focusRepository, isBusy, journeyId, refresh])

  return {
    sessions,
    activeSession,
    recommendedStep,
    isLoading,
    isBusy,
    error,
    startPomodoro,
    startCustom,
    pause,
    resume,
    complete,
    cancel,
    refresh,
  }
}
