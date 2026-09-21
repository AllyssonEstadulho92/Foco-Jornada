import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PayrollDayKind } from '../../../domain/payroll/Payroll'
import { PayrollDayKindSelect, payrollSelection, payrollWeekday } from './PayrollDayKindSelect'

const options: { value: PayrollDayKind; label: string }[] = [
  { value: 'work', label: 'Trabalho' },
  { value: 'rest', label: 'Folga' },
  { value: 'holiday', label: 'Feriado' },
]

afterEach(cleanup)

describe('PayrollDayKindSelect', () => {
  it('classifica sábado e domingo em data civil independentemente do fuso', () => {
    expect(payrollWeekday('2026-09-19')).toBe(6)
    expect(payrollWeekday('2026-09-20')).toBe(0)
    expect(payrollWeekday('2026-02-30')).toBeNull()
    expect(payrollSelection('work', '2026-09-19')).toBe('weekend-saturday')
    expect(payrollSelection('work', '2026-09-20')).toBe('weekend-sunday')
    expect(payrollSelection('work', '2026-09-21')).toBe('work')
  })

  it('permite selecionar sábado no dia correto mas persiste o tipo work existente', () => {
    const onChange = vi.fn()
    render(<PayrollDayKindSelect date="2026-09-19" kind="rest" options={options} onChange={onChange} />)
    expect(screen.getByRole('option', { name: 'Domingo (trabalho normal)' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Sábado (trabalho normal)' })).not.toBeDisabled()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'weekend-saturday' } })
    expect(onChange).toHaveBeenCalledWith('work')
  })

  it('mostra domingo quando o plano anterior já guardou work e mantém Folga', () => {
    const onChange = vi.fn()
    const { rerender } = render(<PayrollDayKindSelect date="2026-09-20" kind="work" options={options} onChange={onChange} />)
    expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('weekend-sunday')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'rest' } })
    expect(onChange).toHaveBeenCalledWith('rest')
    rerender(<PayrollDayKindSelect date="2026-09-20" kind="rest" options={options} onChange={onChange} />)
    expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('rest')
  })

  it('não aceita domingo num sábado por alteração artificial do valor', () => {
    const onChange = vi.fn()
    render(<PayrollDayKindSelect date="2026-09-19" kind="rest" options={options} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'weekend-sunday' } })
    expect(onChange).not.toHaveBeenCalled()
  })
})
