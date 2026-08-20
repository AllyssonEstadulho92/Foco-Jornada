import { createCoffeeRecord, type CoffeeRecord } from '../../domain/coffee/CoffeeRecord'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import type { JourneyRepository } from '../journey/JourneyRepository'
import type { SettingsRepository } from '../settings/SettingsRepository'
import type { CoffeeRepository } from './CoffeeRepository'

export async function addCoffee({
  coffeeRepository,
  journeyRepository,
  settingsRepository,
  quantity = 1,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}: {
  coffeeRepository: CoffeeRepository
  journeyRepository: JourneyRepository
  settingsRepository: SettingsRepository
  quantity?: number
  now?: () => Date
  createId?: () => string
}): Promise<CoffeeRecord> {
  const current = now()
  const [journey, settings] = await Promise.all([
    journeyRepository.getActive(),
    settingsRepository.get(),
  ])

  const record = createCoffeeRecord({
    id: createId(),
    journeyId: journey?.id,
    date: toLocalDateKey(current),
    quantity,
    unitPrice: settings.coffeeUnitPrice,
    now: current.toISOString(),
  })

  await coffeeRepository.add(record)
  return record
}
