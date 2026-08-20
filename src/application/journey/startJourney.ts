import { createJourney, type Journey } from '../../domain/journey/Journey'
import { toLocalDateKey } from '../../shared/utils/dateTime'
import type { JourneyRepository } from './JourneyRepository'

export type StartJourneyResult =
  | { status: 'started'; journey: Journey }
  | { status: 'already-active'; journey: Journey }

export interface StartJourneyDependencies {
  repository: JourneyRepository
  now?: () => Date
  createId?: () => string
}

export async function startJourney({
  repository,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}: StartJourneyDependencies): Promise<StartJourneyResult> {
  const existing = await repository.getActive()

  if (existing) {
    return { status: 'already-active', journey: existing }
  }

  const currentDate = now()
  const timestamp = currentDate.toISOString()
  const journey = createJourney({
    id: createId(),
    date: toLocalDateKey(currentDate),
    now: timestamp,
  })

  const created = await repository.createIfNoActive(journey)

  if (created) {
    return { status: 'started', journey }
  }

  const concurrentJourney = await repository.getActive()

  if (!concurrentJourney) {
    throw new Error('Não foi possível confirmar a jornada ativa após a criação concorrente.')
  }

  return { status: 'already-active', journey: concurrentJourney }
}
