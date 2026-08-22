export type AppFeedbackTone = 'success' | 'error' | 'info'

export interface AppFeedback {
  id: string
  tone: AppFeedbackTone
  title: string
  detail: string
}

type AppFeedbackListener = (feedback: AppFeedback) => void

const listeners = new Set<AppFeedbackListener>()
let sequence = 0

export function emitAppFeedback(tone: AppFeedbackTone, title: string, detail = '') {
  const feedback: AppFeedback = {
    id: `feedback-${Date.now()}-${sequence++}`,
    tone,
    title,
    detail,
  }

  listeners.forEach((listener) => listener(feedback))
  return feedback
}

export function subscribeAppFeedback(listener: AppFeedbackListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
