import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { cancelActivity } from '../../application/activities/cancelActivity'
import { completeActivity } from '../../application/activities/completeActivity'
import { createActivity } from '../../application/activities/createActivity'
import { editActivity } from '../../application/activities/editActivity'
import { startActivity } from '../../application/activities/startActivity'
import type { Activity } from '../../domain/activities/Activity'
import { useAppServices } from '../providers/AppServicesProvider'

export function useActivityController(journeyId?: string) {
  const { journeyRepository, activityRepository } = useAppServices()
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeActivity, setActiveActivity] = useState<Activity | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!journeyId) {
      setActivities([])
      setActiveActivity(undefined)
      return
    }

    const [records, active] = await Promise.all([
      activityRepository.listByJourney(journeyId),
      activityRepository.getActiveForJourney(journeyId),
    ])

    setActivities(records)
    setActiveActivity(active)
  }, [activityRepository, journeyId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        await refresh()
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar atividades.')
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

  const create = useCallback(
    async (name: string, description?: string) => {
      if (isBusy) return false
      try {
        setIsBusy(true)
        setError(null)
        const result = await createActivity({
          journeyRepository,
          activityRepository,
          name,
          description,
        })
        await refresh()

        if (result.status === 'created') {
          toast.success('Atividade criada.')
          return true
        }

        toast.error('Inicia uma jornada antes de criar atividades.')
        return false
      } catch (createError) {
        const message = createError instanceof Error ? createError.message : 'Erro ao criar atividade.'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsBusy(false)
      }
    },
    [activityRepository, isBusy, journeyRepository, refresh],
  )

  const edit = useCallback(
    async (activityId: string, name: string, description?: string) => {
      if (isBusy) return false
      try {
        setIsBusy(true)
        setError(null)
        const result = await editActivity({ activityRepository, activityId, name, description })
        await refresh()

        if (result.status === 'updated') {
          toast.success('Atividade atualizada.')
          return true
        }

        toast.error('A atividade já não pode ser editada.')
        return false
      } catch (editError) {
        const message = editError instanceof Error ? editError.message : 'Erro ao editar atividade.'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsBusy(false)
      }
    },
    [activityRepository, isBusy, refresh],
  )

  const start = useCallback(
    async (activityId: string) => {
      if (isBusy) return
      try {
        setIsBusy(true)
        setError(null)
        const result = await startActivity({ journeyRepository, activityRepository, activityId })
        await refresh()

        if (result.status === 'started') {
          toast.success('Atividade iniciada.')
        } else if (result.status === 'another-active') {
          toast.error(`Conclui primeiro a atividade "${result.activity.name}".`)
        } else {
          toast.error('Não foi possível iniciar a atividade.')
        }
      } catch (startError) {
        const message = startError instanceof Error ? startError.message : 'Erro ao iniciar atividade.'
        setError(message)
        toast.error(message)
      } finally {
        setIsBusy(false)
      }
    },
    [activityRepository, isBusy, journeyRepository, refresh],
  )

  const complete = useCallback(
    async (activityId: string) => {
      if (isBusy) return
      try {
        setIsBusy(true)
        setError(null)
        const result = await completeActivity({ activityRepository, activityId })
        await refresh()

        if (result.status === 'completed') toast.success('Atividade concluída.')
        else toast.error('A atividade já não está ativa.')
      } catch (completeError) {
        const message =
          completeError instanceof Error ? completeError.message : 'Erro ao concluir atividade.'
        setError(message)
        toast.error(message)
      } finally {
        setIsBusy(false)
      }
    },
    [activityRepository, isBusy, refresh],
  )

  const cancel = useCallback(
    async (activityId: string) => {
      if (isBusy) return
      try {
        setIsBusy(true)
        setError(null)
        const result = await cancelActivity({ activityRepository, activityId })
        await refresh()

        if (result.status === 'cancelled') toast.success('Atividade cancelada.')
        else toast.error('A atividade já está encerrada.')
      } catch (cancelError) {
        const message = cancelError instanceof Error ? cancelError.message : 'Erro ao cancelar atividade.'
        setError(message)
        toast.error(message)
      } finally {
        setIsBusy(false)
      }
    },
    [activityRepository, isBusy, refresh],
  )

  return {
    activities,
    activeActivity,
    isLoading,
    isBusy,
    error,
    create,
    edit,
    start,
    complete,
    cancel,
    refresh,
  }
}
