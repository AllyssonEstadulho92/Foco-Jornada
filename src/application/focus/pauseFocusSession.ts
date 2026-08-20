import { pauseFocusSession as pauseEntity, type FocusSession } from '../../domain/focus/FocusSession'
import type { FocusRepository } from './FocusRepository'

export type PauseFocusResult =
  | { status: 'paused'; session: FocusSession }
  | { status: 'not-open' }
  | { status: 'not-running'; session: FocusSession }

export async function pauseFocusSession({
  focusRepository,
  journeyId,
  now = () => new Date(),
}: {
  focusRepository: FocusRepository
  journeyId: string
  now?: () => Date
}): Promise<PauseFocusResult> {
  const current = await focusRepository.getOpenForJourney(journeyId)
  if (!current) return { status: 'not-open' }
  if (current.status !== 'running') return { status: 'not-running', session: current }

  const paused = pauseEntity(current, now().toISOString())
  const persisted = await focusRepository.updateIfStatus(paused, ['running'])
  if (!persisted) {
    const latest = await focusRepository.getById(current.id)
    return latest ? { status: 'not-running', session: latest } : { status: 'not-open' }
  }

  return { status: 'paused', session: paused }
}
