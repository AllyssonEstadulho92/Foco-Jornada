import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { addCoffee } from '../../application/coffee/addCoffee'
import type { CoffeeRecord } from '../../domain/coffee/CoffeeRecord'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import { useAppServices } from '../providers/AppServicesProvider'

export function useCoffeeController(date = toLocalDateKey(new Date())) {
  const { coffeeRepository, journeyRepository, settingsRepository } = useAppServices()
  const [records, setRecords] = useState<CoffeeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setRecords(await coffeeRepository.listByDate(date))
  }, [coffeeRepository, date])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        setIsLoading(true)
        await refresh()
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar cafés.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const add = useCallback(
    async (quantity = 1) => {
      if (isBusy) return
      try {
        setIsBusy(true)
        setError(null)
        await addCoffee({ coffeeRepository, journeyRepository, settingsRepository, quantity })
        await refresh()
        toast.success(quantity === 1 ? 'Café registado.' : `${quantity} cafés registados.`)
      } catch (addError) {
        const message = addError instanceof Error ? addError.message : 'Erro ao registar café.'
        setError(message)
        toast.error(message)
      } finally {
        setIsBusy(false)
      }
    },
    [coffeeRepository, isBusy, journeyRepository, refresh, settingsRepository],
  )

  const totals = useMemo(
    () => ({
      quantity: records.reduce((sum, record) => sum + record.quantity, 0),
      cost: Math.round(records.reduce((sum, record) => sum + record.totalPrice, 0) * 100) / 100,
    }),
    [records],
  )

  return { records, totals, isLoading, isBusy, error, add, refresh }
}
