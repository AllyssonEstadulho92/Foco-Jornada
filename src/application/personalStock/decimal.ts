const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:[.,](\d+))?$/

export const MEDICATION_SCALE = 6

export function parseDecimalToMinor(raw: string, scale = MEDICATION_SCALE): bigint {
  const value = raw.trim()
  const match = DECIMAL_PATTERN.exec(value)
  if (!match) throw new Error('Quantidade decimal inválida.')

  const [, sign, integerPart, fractionPart = ''] = match
  if (fractionPart.length > scale) {
    throw new Error(`A quantidade suporta no máximo ${scale} casas decimais.`)
  }

  const paddedFraction = fractionPart.padEnd(scale, '0')
  const factor = 10n ** BigInt(scale)
  const absolute = BigInt(integerPart) * factor + BigInt(paddedFraction || '0')
  return sign === '-' ? -absolute : absolute
}

export function minorToDecimal(rawMinor: string | bigint, scale = MEDICATION_SCALE): string {
  const minor = typeof rawMinor === 'bigint' ? rawMinor : BigInt(rawMinor)
  if (scale === 0) return minor.toString()

  const negative = minor < 0n
  const absolute = negative ? -minor : minor
  const factor = 10n ** BigInt(scale)
  const integerPart = absolute / factor
  const fractionPart = (absolute % factor).toString().padStart(scale, '0').replace(/0+$/, '')
  const rendered = fractionPart ? `${integerPart}.${fractionPart}` : integerPart.toString()
  return negative ? `-${rendered}` : rendered
}

export function parsePositiveDecimal(raw: string, scale = MEDICATION_SCALE): bigint {
  const value = parseDecimalToMinor(raw, scale)
  if (value <= 0n) throw new Error('A quantidade deve ser maior que zero.')
  return value
}

export function parsePositiveStickInteger(value: number): bigint {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('A quantidade de sticks deve ser um número inteiro positivo.')
  }
  return BigInt(value)
}
