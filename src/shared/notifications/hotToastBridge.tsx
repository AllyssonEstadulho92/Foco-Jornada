/* eslint-disable react-refresh/only-export-components -- este ficheiro adapta a API de react-hot-toast ao centro de notificações interno. */
import { useEffect, useRef, useState } from 'react'
import { pushAppNotification } from '../../presentation/store/useNotificationStore'
import {
  subscribeAppFeedback,
  type AppFeedback,
} from './appFeedback'

function textOf(message: unknown): string {
  if (typeof message === 'string') return message
  if (typeof message === 'number') return String(message)
  if (message instanceof Error) return message.message
  return 'Atualização da aplicação.'
}

function baseToast(message: unknown) {
  pushAppNotification('info', textOf(message))
  return String(Date.now())
}

const toast = Object.assign(baseToast, {
  success(message: unknown) {
    pushAppNotification('success', textOf(message))
    return String(Date.now())
  },
  error(message: unknown) {
    pushAppNotification('error', textOf(message))
    return String(Date.now())
  },
  loading(message: unknown) {
    pushAppNotification('info', textOf(message))
    return String(Date.now())
  },
  dismiss() {
    return undefined
  },
})

export default toast

function FeedbackIcon({ tone }: { tone: AppFeedback['tone'] }) {
  if (tone === 'success') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6.5 12.5 3.3 3.3 7.7-8" />
      </svg>
    )
  }

  if (tone === 'error') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 7.5v5.2M12 16.5h.01" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 10.5v6M12 7.5h.01" />
    </svg>
  )
}

export function Toaster() {
  const [feedbackItems, setFeedbackItems] = useState<AppFeedback[]>([])
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const unsubscribe = subscribeAppFeedback((feedback) => {
      setFeedbackItems((current) => [...current, feedback].slice(-3))

      const timer = window.setTimeout(() => {
        setFeedbackItems((current) => current.filter((item) => item.id !== feedback.id))
        timersRef.current = timersRef.current.filter((item) => item !== timer)
      }, feedback.tone === 'error' ? 4500 : 3200)

      timersRef.current.push(timer)
    })

    return () => {
      unsubscribe()
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
    }
  }, [])

  if (feedbackItems.length === 0) return null

  return (
    <div className="appFeedbackViewport" aria-live="polite" aria-atomic="false">
      {feedbackItems.map((feedback) => (
        <div
          className={`appFeedbackToast appFeedbackToast-${feedback.tone}`}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          key={feedback.id}
        >
          <span className="appFeedbackIcon" aria-hidden="true">
            <FeedbackIcon tone={feedback.tone} />
          </span>
          <div className="appFeedbackCopy">
            <strong>{feedback.title}</strong>
            {feedback.detail ? <span>{feedback.detail}</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
