export interface AbsoluteTimerSnapshot {
  startedAt: string
  deadlineAt: string
  durationSeconds: number
}

function timestampMs(value: Date | string, label: string): number {
  const ms = value instanceof Date ? value.getTime() : Date.parse(value)
  if (!Number.isFinite(ms)) throw new Error(`${label} inválido.`)
  return ms
}

export function createAbsoluteTimer(startedAt: Date | string, durationSeconds: number): AbsoluteTimerSnapshot {
  if (!Number.isInteger(durationSeconds) || durationSeconds <= 0) {
    throw new Error('A duração do temporizador tem de ser um número inteiro de segundos superior a zero.')
  }

  const startedAtMs = timestampMs(startedAt, 'Instante de início')
  return {
    startedAt: new Date(startedAtMs).toISOString(),
    deadlineAt: new Date(startedAtMs + durationSeconds * 1000).toISOString(),
    durationSeconds,
  }
}

export function remainingMilliseconds(deadlineAt: Date | string, now: Date | string = new Date()): number {
  const deadlineMs = timestampMs(deadlineAt, 'Prazo')
  const nowMs = timestampMs(now, 'Hora atual')
  return Math.max(0, deadlineMs - nowMs)
}

export function elapsedMilliseconds(startedAt: Date | string, now: Date | string = new Date()): number {
  const startedAtMs = timestampMs(startedAt, 'Instante de início')
  const nowMs = timestampMs(now, 'Hora atual')
  return Math.max(0, nowMs - startedAtMs)
}

export function progressPercent(snapshot: AbsoluteTimerSnapshot, now: Date | string = new Date()): number {
  const elapsed = elapsedMilliseconds(snapshot.startedAt, now)
  const durationMs = snapshot.durationSeconds * 1000
  return Math.min(100, Math.max(0, (elapsed / durationMs) * 100))
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}
