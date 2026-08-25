export class NonexistentLocalTimeError extends Error {}
export class AmbiguousLocalTimeError extends Error {}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function partsInZone(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

function offsetAt(epochMs: number, timeZone: string): number {
  const parts = partsInZone(new Date(epochMs), timeZone)
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return representedAsUtc - epochMs
}

function sameLocalParts(parts: ZonedParts, target: ZonedParts): boolean {
  return parts.year === target.year
    && parts.month === target.month
    && parts.day === target.day
    && parts.hour === target.hour
    && parts.minute === target.minute
    && parts.second === target.second
}

export function dateKeyInZone(date: Date, timeZone: string): string {
  const parts = partsInZone(date, timeZone)
  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day.toString().padStart(2, '0')}`
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

export function resolveZonedLocalDateTime(
  dateKey: string,
  localTime: string,
  timeZone: string,
  fold?: 0 | 1,
): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute] = localTime.split(':').map(Number)
  if (![year, month, day, hour, minute].every(Number.isInteger)) throw new Error('Data ou hora inválida.')

  const target: ZonedParts = { year, month, day, hour, minute, second: 0 }
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  const sampleOffsets = new Set<number>([
    offsetAt(naiveUtc - 36 * 3_600_000, timeZone),
    offsetAt(naiveUtc, timeZone),
    offsetAt(naiveUtc + 36 * 3_600_000, timeZone),
  ])

  const candidates = [...sampleOffsets]
    .map((offset) => new Date(naiveUtc - offset))
    .filter((candidate) => sameLocalParts(partsInZone(candidate, timeZone), target))
    .sort((left, right) => left.getTime() - right.getTime())

  const unique = [...new Map(candidates.map((candidate) => [candidate.getTime(), candidate])).values()]
  if (unique.length === 0) {
    throw new NonexistentLocalTimeError('Este horário não existe devido à mudança da hora.')
  }
  if (unique.length > 1 && fold === undefined) {
    throw new AmbiguousLocalTimeError('Este horário ocorre duas vezes devido à mudança da hora; escolhe a ocorrência.')
  }
  return unique[fold ?? 0]
}
