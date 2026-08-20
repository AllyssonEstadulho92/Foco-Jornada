import { completeFocusSession as completeEntity, type FocusSession } from '../../domain/focus/FocusSession'
import type { FocusRepository } from './FocusRepository'

export type CompleteFocusResult =
  | { status: 'completed'; session: FocusSession }
  | { status: 'not-open' }
  | { status: 'already-closed'; session: FocusSession }

export async function completeFocusSession({
  focusRepository,
  journeyId,
  now = () => new Date(),
}: {
  focusRepository: FocusRepository
  journeyId: string
  now?: () => Date
}): Promise<CompleteFocusResult> {
  const current = await focusRepository.getOpenForJourney(journeyId)
  if (!current) return { status: 'not-open' }

  const completed = completeEntity(current, now().toISOString())
  const persisted = await focusRepository.updateIfStatus(completed, ['running', 'paused'])

  if (!persisted) {
    const latest = await focusRepository.getById(current.id)
    return latest ? { status: 'already-closed', session: latest } : { status: 'not-open' }
  }

  return { status: 'completed', session: completed }
}
