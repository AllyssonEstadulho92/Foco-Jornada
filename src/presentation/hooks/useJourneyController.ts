import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { finishJourney } from '../../application/journey/finishJourney'
import { startJourney } from '../../application/journey/startJourney'
import type { Journey } from '../../domain/journey/Journey'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'

export function useJourneyController() {
  const { journeyRepository } = useAppServices()
  const [activeJourney, setActiveJourney] = useState<Journey | undefined>()
  const [todayJourneys, setTodayJourneys] = useState<Journey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const dateKey = toLocalDateKey(new Date())
    const [active, journeys] = await Promise.all([
      journeyRepository.getActive(),
      journeyRepository.listByDate(dateKey),
    ])

    setActiveJourney(active)
    setTodayJourneys(journeys)
  }, [journeyRepository])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        await refresh()
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar a jornada.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [refresh])

  const start = useCallback(async () => {
    if (isBusy) return

    try {
      setIsBusy(true)
      setError(null)
      const result = await startJourney({ repository: journeyRepository })
      await refresh()

      if (result.status === 'started') {
        toast.success('Jornada iniciada.')
      } else {
        toast('Já existe uma jornada ativa.')
      }
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'Erro ao iniciar a jornada.'
      setError(message)
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }, [isBusy, journeyRepository, refresh])

  const finish = useCallback(async () => {
    if (isBusy || !activeJourney) return

    try {
      setIsBusy(true)
      setError(null)
      const result = await finishJourney({
        repository: journeyRepository,
        journeyId: activeJourney.id,
      })

      await refresh()

      if (result.status === 'finished') {
        toast.success('Jornada terminada.')
        return
      }

      toast.error('A jornada ativa mudou. Os dados foram atualizados.')
    } catch (finishError) {
      const message = finishError instanceof Error ? finishError.message : 'Erro ao terminar a jornada.'
      setError(message)
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }, [activeJourney, isBusy, journeyRepository, refresh])

  return {
    activeJourney,
    todayJourneys,
    isLoading,
    isBusy,
    error,
    start,
    finish,
    refresh,
  }
}
