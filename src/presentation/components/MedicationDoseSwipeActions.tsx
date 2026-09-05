import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { minorToDecimal } from '../../application/personalStock/decimal'
import type { MedicationSchedule } from '../../domain/personalStock/models'
import '../../styles/medication-dose-swipe.css'
import { AppIcon } from './ui/AppIcon'

const ACTION_WIDTH = 184
const OPEN_THRESHOLD = 58
const AXIS_THRESHOLD = 7

interface SwipeActionsProps {
  children: ReactNode
  label: string
  open: boolean
  disabled?: boolean
  onOpenChange: (open: boolean) => void
  onDefine: () => void
  onDelete: () => void
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  startOffset: number
  axis: 'x' | 'y' | null
  moved: boolean
}

function clampOffset(value: number): number {
  return Math.max(-ACTION_WIDTH, Math.min(0, value))
}

export function MedicationDoseSwipeActions({
  children,
  label,
  open,
  disabled = false,
  onOpenChange,
  onDefine,
  onDelete,
}: SwipeActionsProps) {
  const [offset, setOffset] = useState(open ? -ACTION_WIDTH : 0)
  const offsetRef = useRef(offset)
  const dragRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)

  useEffect(() => {
    const next = open ? -ACTION_WIDTH : 0
    offsetRef.current = next
    setOffset(next)
  }, [open])

  function setDragOffset(value: number) {
    const next = clampOffset(value)
    offsetRef.current = next
    setOffset(next)
  }

  function settle() {
    const shouldOpen = Math.abs(offsetRef.current) >= OPEN_THRESHOLD
    onOpenChange(shouldOpen)
    const next = shouldOpen ? -ACTION_WIDTH : 0
    offsetRef.current = next
    setOffset(next)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return
    const target = event.target
    if (target instanceof Element && target.closest('[data-med-dose-swipe-action]')) return

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offsetRef.current,
      axis: null,
      moved: false,
    }
    suppressClickRef.current = false
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY

    if (!drag.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= AXIS_THRESHOLD) {
      drag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
    }
    if (drag.axis !== 'x') return

    drag.moved = true
    suppressClickRef.current = true
    event.preventDefault()
    setDragOffset(drag.startOffset + deltaX)
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (drag.axis === 'x') settle()
  }

  return (
    <div className={`medDoseSwipeRow${open ? ' isOpen' : ''}${disabled ? ' isDisabled' : ''}`}>
      <div className="medDoseSwipeActions" aria-hidden={!open}>
        <button
          type="button"
          className="medDoseSwipeAction medDoseSwipeDefine"
          data-med-dose-swipe-action
          tabIndex={open && !disabled ? 0 : -1}
          disabled={disabled}
          aria-label={`Definir horário das ${label}`}
          onClick={() => {
            onOpenChange(false)
            onDefine()
          }}
        >
          <AppIcon name="settings" aria-hidden="true" />
          <span>Definir</span>
        </button>
        <button
          type="button"
          className="medDoseSwipeAction medDoseSwipeDelete"
          data-med-dose-swipe-action
          tabIndex={open && !disabled ? 0 : -1}
          disabled={disabled}
          aria-label={`Eliminar horário das ${label}`}
          onClick={() => {
            onOpenChange(false)
            onDelete()
          }}
        >
          <AppIcon name="trash" aria-hidden="true" />
          <span>Eliminar</span>
        </button>
      </div>

      <div
        className="medDoseSwipeContent"
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return
          event.preventDefault()
          event.stopPropagation()
          suppressClickRef.current = false
        }}
      >
        {children}
      </div>
    </div>
  )
}

export type MedicationScheduleActionMode = 'define' | 'delete'

interface ScheduleActionDialogProps {
  mode: MedicationScheduleActionMode
  schedule: MedicationSchedule
  unit: string
  busy: boolean
  onCancel: () => void
  onDefine: (localTime: string, quantity: string) => void
  onDelete: () => void
}

export function MedicationScheduleActionDialog({
  mode,
  schedule,
  unit,
  busy,
  onCancel,
  onDefine,
  onDelete,
}: ScheduleActionDialogProps) {
  const [localTime, setLocalTime] = useState(schedule.localTime)
  const [quantity, setQuantity] = useState(minorToDecimal(schedule.quantityMinor))
  const firstInputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setLocalTime(schedule.localTime)
    setQuantity(minorToDecimal(schedule.quantityMinor))
  }, [schedule])

  useEffect(() => {
    const target = mode === 'define' ? firstInputRef.current : cancelRef.current
    target?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [busy, mode, onCancel])

  const title = mode === 'define' ? 'Definir horário' : 'Eliminar horário'

  return (
    <div
      className="medDoseActionBackdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <section
        className={`medDoseActionDialog${mode === 'delete' ? ' isDanger' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="med-dose-action-title"
      >
        <header className="medDoseActionHeader">
          <span className="medDoseActionIcon" aria-hidden="true">
            <AppIcon name={mode === 'define' ? 'settings' : 'trash'} />
          </span>
          <div>
            <h3 id="med-dose-action-title">{title}</h3>
            <p>{schedule.localTime} · {minorToDecimal(schedule.quantityMinor)} {unit}</p>
          </div>
          <button
            ref={cancelRef}
            type="button"
            className="medDoseActionClose"
            aria-label="Fechar"
            disabled={busy}
            onClick={onCancel}
          >
            <AppIcon name="close" aria-hidden="true" />
          </button>
        </header>

        {mode === 'define' ? (
          <form
            className="medDoseActionForm"
            onSubmit={(event) => {
              event.preventDefault()
              if (!busy && localTime && quantity.trim()) onDefine(localTime, quantity)
            }}
          >
            <p className="medDoseActionNotice">
              A nova definição entra em vigor amanhã. A ocorrência de hoje e o histórico anterior ficam preservados.
            </p>
            <div className="medDoseActionFields">
              <label>
                Hora
                <input
                  ref={firstInputRef}
                  type="time"
                  value={localTime}
                  required
                  disabled={busy}
                  onChange={(event) => setLocalTime(event.target.value)}
                />
              </label>
              <label>
                Quantidade
                <input
                  inputMode="decimal"
                  value={quantity}
                  required
                  disabled={busy}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </label>
            </div>
            <div className="medDoseActionButtons">
              <button type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
              <button className="medDoseActionPrimary" type="submit" disabled={busy || !localTime || !quantity.trim()}>
                Guardar definição
              </button>
            </div>
          </form>
        ) : (
          <div className="medDoseActionDeleteBody">
            <p>
              O horário termina hoje e deixa de gerar tomas a partir de amanhã. As tomas, correções e movimentos de stock já registados não são apagados.
            </p>
            <div className="medDoseActionButtons">
              <button type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
              <button className="medDoseActionDanger" type="button" disabled={busy} onClick={onDelete}>
                Eliminar horário
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
