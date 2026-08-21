import { describe, expect, it } from 'vitest'
import { normalizeNumberInputValue } from './numberInput'

describe('normalizeNumberInputValue', () => {
  it('remove zeros à esquerda de inteiros maiores que zero', () => {
    expect(normalizeNumberInputValue('0820')).toBe('820')
    expect(normalizeNumberInputValue('030')).toBe('30')
    expect(normalizeNumberInputValue('0007')).toBe('7')
  })

  it('mantém zero simples e valores decimais inferiores a um', () => {
    expect(normalizeNumberInputValue('0')).toBe('0')
    expect(normalizeNumberInputValue('0.5')).toBe('0.5')
    expect(normalizeNumberInputValue('00.5')).toBe('0.5')
    expect(normalizeNumberInputValue('')).toBe('')
  })
})
