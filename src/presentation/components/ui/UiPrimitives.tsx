import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { AppIcon } from './AppIcon'

export function UiCard({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={`uiCard ${className}`.trim()} {...props} />
}

export function SectionHeader({
  title,
  description,
  action,
  id,
}: {
  title: string
  description?: string
  action?: ReactNode
  id?: string
}) {
  return (
    <header className="uiSectionHeader">
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="uiSectionHeaderAction">{action}</div> : null}
    </header>
  )
}

export function MetricCard({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <UiCard className="uiMetricCard">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </UiCard>
  )
}

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`uiStatusBadge uiStatusBadge-${tone}`}>{children}</span>
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export function UiButton({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={`uiButton uiButton-${variant} ${className}`.trim()} {...props} />
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="uiState uiState-empty" role="status">
      <span className="uiStateIcon" aria-hidden="true"><AppIcon name="check" /></span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="uiStateAction">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ title = 'Não foi possível concluir a operação.', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="uiState uiState-error" role="alert">
      <span className="uiStateIcon" aria-hidden="true"><AppIcon name="warning" /></span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="uiStateAction">{action}</div> : null}
    </div>
  )
}

export function LoadingState({ label = 'A carregar…' }: { label?: string }) {
  return (
    <div className="uiState uiState-loading" role="status" aria-live="polite">
      <span className="uiSpinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="uiOverlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="uiModal" role="dialog" aria-modal="true" aria-labelledby="ui-modal-title">
        <header>
          <div>
            <h2 id="ui-modal-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="uiIconButton" aria-label="Fechar" onClick={onClose}><AppIcon name="close" /></button>
        </header>
        <div className="uiModalBody">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </section>
    </div>
  )
}

export function Drawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="uiOverlay uiDrawerOverlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside className="uiDrawer" role="dialog" aria-modal="true" aria-labelledby="ui-drawer-title">
        <header>
          <h2 id="ui-drawer-title">{title}</h2>
          <button type="button" className="uiIconButton" aria-label="Fechar" onClick={onClose}>×</button>
        </header>
        <div className="uiDrawerBody">{children}</div>
      </aside>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={(
        <div className="uiDialogActions">
          <UiButton onClick={onCancel}>{cancelLabel}</UiButton>
          <UiButton variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</UiButton>
        </div>
      )}
    >
      <span className="uiConfirmMarker" aria-hidden="true">?</span>
    </Modal>
  )
}
