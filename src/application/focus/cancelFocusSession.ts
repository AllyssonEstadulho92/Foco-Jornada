import { cancelFocusSession as cancelEntity, type FocusSession } from '../../domain/focus/FocusSession'
import type { FocusRepository } from './FocusRepository'

export type CancelFocusResult =
  | { status: 'cancelled'; session: FocusSession }
  | { status: 'not-open' }
  | { status: 'already-closed'; session: FocusSession }

export async function cancelFocusSession({
  focusRepository,
  journeyId,
  now = () => new Date(),
}: {
  focusRepository: FocusRepository
  journeyId: string
  now?: () => Date
}): Promise<CancelFocusResult> {
  const current = await focusRepository.getOpenForJourney(journeyId)
  if (!current) return { status: 'not-open' }

  const cancelled = cancelEntity(current, now().toISOString())
  const persisted = await focusRepository.updateIfStatus(cancelled, ['running', 'paused'])

  if (!persisted) {
    const latest = await focusRepository.getById(current.id)
    return latest ? { status: 'already-closed', session: latest } : { status: 'not-open' }
  }

  return { status: 'cancelled', session: cancelled }
}
