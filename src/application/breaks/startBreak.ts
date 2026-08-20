import { createBreakRecord, type BreakRecord, type BreakType } from '../../domain/breaks/BreakRecord'
import type { JourneyRepository } from '../journey/JourneyRepository'
import type { BreakRepository } from './BreakRepository'

export type StartBreakResult =
  | { status: 'started'; breakRecord: BreakRecord }
  | { status: 'no-active-journey' }
  | { status: 'already-active'; breakRecord: BreakRecord }

export interface StartBreakDependencies {
  journeyRepository: JourneyRepository
  breakRepository: BreakRepository
  type: BreakType
  plannedDurationMinutes?: number
  now?: () => Date
  createId?: () => string
}

export async function startBreak({
  journeyRepository,
  breakRepository,
  type,
  plannedDurationMinutes,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}: StartBreakDependencies): Promise<StartBreakResult> {
  const activeJourney = await journeyRepository.getActive()

  if (!activeJourney) {
    return { status: 'no-active-journey' }
  }

  const existingBreak = await breakRepository.getActiveForJourney(activeJourney.id)

  if (existingBreak) {
    return { status: 'already-active', breakRecord: existingBreak }
  }

  const record = createBreakRecord({
    id: createId(),
    journeyId: activeJourney.id,
    type,
    plannedDurationMinutes,
    now: now().toISOString(),
  })

  const created = await breakRepository.createIfNoActive(record)

  if (created) {
    return { status: 'started', breakRecord: record }
  }

  const concurrentBreak = await breakRepository.getActiveForJourney(activeJourney.id)

  if (!concurrentBreak) {
    throw new Error('Não foi possível confirmar a pausa ativa após a criação concorrente.')
  }

  return { status: 'already-active', breakRecord: concurrentBreak }
}
