export interface CoffeeRecord {
  id: string
  journeyId?: string
  date: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function createCoffeeRecord(input: {
  id: string
  journeyId?: string
  date: string
  quantity: number
  unitPrice: number
  now: string
}): CoffeeRecord {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 50) {
    throw new Error('A quantidade de cafés deve estar entre 1 e 50.')
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0 || input.unitPrice > 100) {
    throw new Error('O preço do café é inválido.')
  }
  if (!Number.isFinite(Date.parse(input.now))) {
    throw new Error('A data do registo de café é inválida.')
  }

  const unitPrice = roundMoney(input.unitPrice)
  return {
    id: input.id,
    journeyId: input.journeyId,
    date: input.date,
    quantity: input.quantity,
    unitPrice,
    totalPrice: roundMoney(unitPrice * input.quantity),
    createdAt: input.now,
  }
}
