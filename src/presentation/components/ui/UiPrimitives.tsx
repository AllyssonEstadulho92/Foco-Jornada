import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

export function UiCard({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={`uiCard ${className}`.trim()} {...props} />
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  id?: string
}) {
  return (
    <header className="uiPageHeader">
      <div>
        {eyebrow ? <span className="uiEyebrow">{eyebrow}</span> : null}
        <h1 id={id}>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="uiPageHeaderAction">{action}</div> : null}
    </header>
  )
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

export function Field({
  label,
  hint,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}) {
  const generatedId = useId()
  const id = props.id ?? generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <label className={`uiField ${error ? 'uiField-error' : ''} ${className}`.trim()} htmlFor={id}>
      <span>{label}</span>
      <input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} />
      {hint ? <small id={hintId}>{hint}</small> : null}
      {error ? <small id={errorId} className="uiFieldError">{error}</small> : null}
    </label>
  )
}

export function InlineNotice({
  tone = 'info',
  title,
  children,
}: {
  tone?: StatusTone
  title?: string
  children: ReactNode
}) {
  return (
    <div className={`uiNotice uiNotice-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <span className="uiNoticeMark" aria-hidden="true">{tone === 'success' ? '✓' : tone === 'warning' ? '!' : tone === 'danger' ? '×' : 'i'}</span>
      <div>
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </div>
  )
}

function StateShell({
  tone,
  icon,
  title,
  description,
  action,
  role = 'status',
}: {
  tone: 'empty' | 'success' | 'warning' | 'error'
  icon: string
  title: string
  description?: string
  action?: ReactNode
  role?: 'status' | 'alert'
}) {
  return (
    <div className={`uiState uiState-${tone}`} role={role}>
      <span className="uiStateIcon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="uiStateAction">{action}</div> : null}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <StateShell tone="empty" icon="○" title={title} description={description} action={action} />
}

export function SuccessState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <StateShell tone="success" icon="✓" title={title} description={description} action={action} />
}

export function WarningState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <StateShell tone="warning" icon="!" title={title} description={description} action={action} />
}

export function ErrorState({ title = 'Não foi possível concluir a operação.', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <StateShell tone="error" icon="!" title={title} description={description} action={action} role="alert" />
}

export function LoadingState({ label = 'A carregar…' }: { label?: string }) {
  return (
    <div className="uiState uiState-loading" role="status" aria-live="polite">
      <span className="uiSpinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function Skeleton({ lines = 3, label = 'A carregar conteúdo' }: { lines?: number; label?: string }) {
  return (
    <div className="uiSkeleton" role="status" aria-label={label}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => <span key={index} />)}
    </div>
  )
}

function useDialogEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'medium',
}: {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: 'small' | 'medium' | 'large'
}) {
  const titleId = useId()
  const descriptionId = useId()
  useDialogEscape(open, onClose)
  if (!open) return null

  return (
    <div className="uiOverlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className={`uiModal uiModal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header>
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button type="button" className="uiIconButton" aria-label="Fechar" onClick={onClose}>×</button>
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
  const titleId = useId()
  const descriptionId = useId()
  useDialogEscape(open, onClose)
  if (!open) return null

  return (
    <div className="uiOverlay uiDrawerOverlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside className="uiDrawer" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}>
        <header>
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button type="button" className="uiIconButton" aria-label="Fechar" onClick={onClose}>×</button>
        </header>
        <div className="uiDrawerBody">{children}</div>
        {footer ? <footer className="uiDrawerFooter">{footer}</footer> : null}
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
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      size="small"
      footer={(
        <div className="uiDialogActions">
          <UiButton onClick={onCancel} disabled={busy}>{cancelLabel}</UiButton>
          <UiButton variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'A processar…' : confirmLabel}
          </UiButton>
        </div>
      )}
    >
      <span className={`uiConfirmMarker ${destructive ? 'uiConfirmMarker-danger' : ''}`} aria-hidden="true">{destructive ? '!' : '?'}</span>
    </Modal>
  )
}
