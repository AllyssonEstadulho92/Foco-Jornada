export type TimeGreeting = 'Bom dia' | 'Boa tarde' | 'Boa noite'

export function getTimeGreeting(date: Date): TimeGreeting {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 20) return 'Boa tarde'
  return 'Boa noite'
}
