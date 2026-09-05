import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MedicationDoseSwipeActions } from './MedicationDoseSwipeActions'

afterEach(() => cleanup())

describe('MedicationDoseSwipeActions', () => {
  it('keeps hidden actions out of the tab order while the row is closed', () => {
    render(
      <MedicationDoseSwipeActions
        label="08:00"
        open={false}
        onOpenChange={() => undefined}
        onDefine={() => undefined}
        onDelete={() => undefined}
      >
        <div>08:00</div>
      </MedicationDoseSwipeActions>,
    )

    expect(screen.getByRole('button', { name: 'Definir horário das 08:00', hidden: true })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('button', { name: 'Eliminar horário das 08:00', hidden: true })).toHaveAttribute('tabindex', '-1')
  })

  it('exposes the actions to keyboard focus and shifts the row when open', () => {
    const { container } = render(
      <MedicationDoseSwipeActions
        label="08:00"
        open
        onOpenChange={() => undefined}
        onDefine={() => undefined}
        onDelete={() => undefined}
      >
        <div>08:00</div>
      </MedicationDoseSwipeActions>,
    )

    expect(screen.getByRole('button', { name: 'Definir horário das 08:00' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('button', { name: 'Eliminar horário das 08:00' })).toHaveAttribute('tabindex', '0')
    expect(container.querySelector('.medDoseSwipeContent')).toHaveStyle({ transform: 'translate3d(-184px, 0, 0)' })
  })

  it('closes the swipe before running an action', () => {
    const onOpenChange = vi.fn()
    const onDefine = vi.fn()
    render(
      <MedicationDoseSwipeActions
        label="08:00"
        open
        onOpenChange={onOpenChange}
        onDefine={onDefine}
        onDelete={() => undefined}
      >
        <div>08:00</div>
      </MedicationDoseSwipeActions>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Definir horário das 08:00' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onDefine).toHaveBeenCalledOnce()
  })
})
