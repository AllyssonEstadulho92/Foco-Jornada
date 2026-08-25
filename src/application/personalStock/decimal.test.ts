import { describe, expect, it } from 'vitest'
import { minorToDecimal, parseDecimalToMinor, parsePositiveDecimal, parsePositiveStickInteger } from './decimal'

describe('personal stock decimal arithmetic', () => {
  it('represents 0.1 + 0.2 without floating point error', () => {
    const total = parseDecimalToMinor('0.1') + parseDecimalToMinor('0.2')
    expect(minorToDecimal(total)).toBe('0.3')
  })

  it('preserves fractional medication quantities exactly', () => {
    expect(minorToDecimal(parseDecimalToMinor('38.125'))).toBe('38.125')
    expect(minorToDecimal(parseDecimalToMinor('0,5'))).toBe('0.5')
  })

  it('rejects silent rounding beyond the supported precision', () => {
    expect(() => parseDecimalToMinor('0.1234567')).toThrow('no máximo 6 casas decimais')
  })

  it('rejects zero and negative positive quantities', () => {
    expect(() => parsePositiveDecimal('0')).toThrow()
    expect(() => parsePositiveDecimal('-1')).toThrow()
  })

  it('accepts sticks only as positive safe integers', () => {
    expect(parsePositiveStickInteger(20)).toBe(20n)
    expect(() => parsePositiveStickInteger(1.5)).toThrow()
    expect(() => parsePositiveStickInteger(-1)).toThrow()
    expect(() => parsePositiveStickInteger(Number.MAX_SAFE_INTEGER + 1)).toThrow()
  })
})
