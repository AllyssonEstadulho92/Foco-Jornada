import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { finishBreak } from '../../application/breaks/finishBreak'
import { startBreak } from '../../application/breaks/startBreak'
import type { BreakRecord, BreakType } from '../../domain/breaks/BreakRecord'
import { useAppServices } from '../providers/AppServicesProvider'

export function useBreakController(journeyId?: string) {
  const { journeyRepository, breakRepository } = useAppServices()
  const [activeBreak, setActiveBreak] = useState<BreakRecord | undefined>()
  const [breaks, setBreaks] = useState<BreakRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!journeyId) {
      setActiveBreak(undefined)
      setBreaks([])
      return
    }

    const [active, records] = await Promise.all([
      breakRepository.getActiveForJourney(journeyId),
      breakRepository.listByJourney(journeyId),
    ])

    setActiveBreak(active)
    setBreaks(records)
  }, [breakRepository, journeyId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        await refresh()
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar as pausas.')
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

  const start = useCallback(
    async (type: BreakType, plannedDurationMinutes?: number) => {
      if (isBusy) return

      try {
        setIsBusy(true)
        setError(null)
        const result = await startBreak({
          journeyRepository,
          breakRepository,
          type,
          plannedDurationMinutes,
        })

        await refresh()

        if (result.status === 'started') {
          toast.success('Pausa iniciada.')
          return
        }

        if (result.status === 'already-active') {
          toast('Já existe uma pausa ativa.')
          return
        }

        toast.error('É necessário iniciar uma jornada antes da pausa.')
      } catch (startError) {
        const message = startError instanceof Error ? startError.message : 'Erro ao iniciar a pausa.'
        setError(message)
        toast.error(message)
      } finally {
        setIsBusy(false)
      }
    },
    [breakRepository, isBusy, journeyRepository, refresh],
  )

  const finish = useCallback(async () => {
    if (isBusy || !activeBreak) return

    try {
      setIsBusy(true)
      setError(null)
      const result = await finishBreak({
        breakRepository,
        journeyId: activeBreak.journeyId,
      })

      await refresh()

      if (result.status === 'finished') {
        toast.success('Pausa terminada.')
      } else {
        toast.error('A pausa ativa mudou. Os dados foram atualizados.')
      }
    } catch (finishError) {
      const message = finishError instanceof Error ? finishError.message : 'Erro ao terminar a pausa.'
      setError(message)
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }, [activeBreak, breakRepository, isBusy, refresh])

  return {
    activeBreak,
    breaks,
    isLoading,
    isBusy,
    error,
    start,
    finish,
    refresh,
  }
}
