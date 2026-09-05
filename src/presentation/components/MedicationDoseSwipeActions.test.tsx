import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MedicationDoseSwipeActions } from './MedicationDoseSwipeActions'

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

  it('exposes the actions to keyboard focus when the row is open', () => {
    render(
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
  })

  it('opens after a deliberate horizontal drag to the left', () => {
    const onOpenChange = vi.fn()
    const { container } = render(
      <MedicationDoseSwipeActions
        label="08:00"
        open={false}
        onOpenChange={onOpenChange}
        onDefine={() => undefined}
        onDelete={() => undefined}
      >
        <div>08:00</div>
      </MedicationDoseSwipeActions>,
    )
    const content = container.querySelector('.medDoseSwipeContent')
    expect(content).not.toBeNull()

    fireEvent.pointerDown(content as Element, { pointerId: 1, button: 0, clientX: 180, clientY: 40 })
    fireEvent.pointerMove(content as Element, { pointerId: 1, clientX: 80, clientY: 43 })
    fireEvent.pointerUp(content as Element, { pointerId: 1, clientX: 80, clientY: 43 })

    expect(onOpenChange).toHaveBeenCalledWith(true)
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
