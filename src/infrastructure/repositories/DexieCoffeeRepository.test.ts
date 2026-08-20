import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCoffeeRecord } from '../../domain/coffee/CoffeeRecord'
import { AppDatabase } from '../database/appDatabase'
import { DexieCoffeeRepository } from './DexieCoffeeRepository'

describe('DexieCoffeeRepository', () => {
  let database: AppDatabase
  let repository: DexieCoffeeRepository

  beforeEach(() => {
    database = new AppDatabase(`foco-jornada-coffee-${crypto.randomUUID()}`)
    repository = new DexieCoffeeRepository(database)
  })

  afterEach(async () => {
    database.close()
    await database.delete()
  })

  it('persiste e consulta cafés pelo dia', async () => {
    const record = createCoffeeRecord({
      id: 'coffee-1',
      date: '2026-08-20',
      quantity: 1,
      unitPrice: 0.7,
      now: '2026-08-20T10:00:00.000Z',
    })
    await repository.add(record)
    expect(await repository.listByDate('2026-08-20')).toEqual([record])
  })
})
