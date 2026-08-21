import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_SETTINGS } from '../../domain/settings/AppSettings'
import { InMemoryCoffeeRepository } from '../../test/InMemoryCoffeeRepository'
import { InMemoryJourneyRepository } from '../../test/InMemoryJourneyRepository'
import { InMemorySettingsRepository } from '../../test/InMemorySettingsRepository'
import { addCoffee } from './addCoffee'

describe('addCoffee', () => {
  it('usa o preço configurado e calcula o total', async () => {
    const coffeeRepository = new InMemoryCoffeeRepository()
    const journeyRepository = new InMemoryJourneyRepository()
    const settingsRepository = new InMemorySettingsRepository({
      ...DEFAULT_APP_SETTINGS,
      coffeeUnitPrice: 0.7,
      currency: 'EUR',
      suggestedBreakIntervalMinutes: 90,
    })

    const record = await addCoffee({
      coffeeRepository,
      journeyRepository,
      settingsRepository,
      quantity: 3,
      now: () => new Date('2026-08-20T10:00:00.000Z'),
      createId: () => 'coffee-1',
    })

    expect(record.quantity).toBe(3)
    expect(record.totalPrice).toBe(2.1)
    expect(coffeeRepository.snapshot()).toHaveLength(1)
  })
})
