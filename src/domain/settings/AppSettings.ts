export interface AppSettings {
  coffeeUnitPrice: number
  currency: 'EUR' | 'USD' | 'GBP'
  suggestedBreakIntervalMinutes: number
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  coffeeUnitPrice: 0.7,
  currency: 'EUR',
  suggestedBreakIntervalMinutes: 90,
}

export function normalizeSettings(value: Partial<AppSettings> | undefined): AppSettings {
  const coffeeUnitPrice = Number(value?.coffeeUnitPrice)
  const suggestedBreakIntervalMinutes = Number(value?.suggestedBreakIntervalMinutes)
  const currency = value?.currency

  return {
    coffeeUnitPrice:
      Number.isFinite(coffeeUnitPrice) && coffeeUnitPrice >= 0 && coffeeUnitPrice <= 100
        ? Math.round(coffeeUnitPrice * 100) / 100
        : DEFAULT_APP_SETTINGS.coffeeUnitPrice,
    currency: currency === 'USD' || currency === 'GBP' || currency === 'EUR' ? currency : 'EUR',
    suggestedBreakIntervalMinutes:
      Number.isFinite(suggestedBreakIntervalMinutes) &&
      suggestedBreakIntervalMinutes >= 15 &&
      suggestedBreakIntervalMinutes <= 480
        ? Math.round(suggestedBreakIntervalMinutes)
        : DEFAULT_APP_SETTINGS.suggestedBreakIntervalMinutes,
  }
}
