import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppServices } from '../providers/AppServicesProvider'

interface StockHubOverview {
  integrity: 'OK' | 'INCONSISTÊNCIA'
  medicationCount: number
  sticksInitialized: boolean
  sticksStock: number | null
  checkedAt: string
}

function MedicationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.1 4.6a4.4 4.4 0 0 1 6.2 0l5.1 5.1a4.4 4.4 0 0 1-6.2 6.2L8.1 10.8a4.4 4.4 0 0 1 0-6.2Z" />
      <path d="m10.2 12.9 6.2-6.2" />
    </svg>
  )
}

function SticksIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="1.8" />
      <path d="M7 7.5v9M9.5 7.5v9M12 7.5v9M14.5 7.5v9M17 7.5v9" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5.1c0 4.7-2.9 8-7 9.9-4.1-1.9-7-5.2-7-9.9V6l7-3Z" />
      <path d="m9.2 12.1 1.9 1.9 3.9-4.3" />
    </svg>
  )
}

function formatCheck(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function PersonalStockHubPage() {
  const { personalStockService } = useAppServices()
  const [overview, setOverview] = useState<StockHubOverview | null>(null)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const [diagnostic, medications, sticks] = await Promise.all([
      personalStockService.diagnostic(),
      personalStockService.listMedications(),
      personalStockService.getSticksSummary(),
    ])
    setOverview({
      integrity: diagnostic.integrity,
      medicationCount: medications.length,
      sticksInitialized: sticks.initialized,
      sticksStock: sticks.stock,
      checkedAt: new Date().toISOString(),
    })
  }, [personalStockService])

  useEffect(() => {
    void load().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o stock pessoal.')
    })
  }, [load])

  return (
    <section className="personalStockPage personalStockHubPage stockHubLinear" aria-labelledby="personal-stock-title">
      <header className="personalStockHeader stockHubHeader">
        <span className="eyebrow">ORGANIZAÇÃO PESSOAL</span>
        <h1 id="personal-stock-title">Medicamentos e sticks veo</h1>
        <p>Duas áreas separadas, com contagens auditáveis, histórico persistente e apenas as ações necessárias.</p>
      </header>

      {message ? <div className="stockMessage" role="status">{message}</div> : null}

      <div className="stockHubLinearGrid">
        <Link to="/medicamentos" className="stockHubLinearCard">
          <span className="stockHubLinearIcon" aria-hidden="true"><MedicationIcon /></span>
          <div>
            <span className="stockPanelTag">MEDICAÇÃO</span>
            <strong>Medicamentos</strong>
            <p>Horários, tomas, stock, notas protegidas e histórico de correções.</p>
            <small>{overview?.medicationCount ?? 0} medicamento(s) registado(s)</small>
          </div>
          <span aria-hidden="true">→</span>
        </Link>

        <Link to="/sticks" className="stockHubLinearCard">
          <span className="stockHubLinearIcon" aria-hidden="true"><SticksIcon /></span>
          <div>
            <span className="stockPanelTag">GLO VEO</span>
            <strong>Sticks veo</strong>
            <p>Stock em maços, utilizações, duração observada e nicotina baseada em fontes documentadas.</p>
            <small>
              {overview?.sticksInitialized
                ? `${overview.sticksStock ?? 0} sticks no ledger`
                : 'stock inicial ainda por confirmar'}
            </small>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <aside className="stockHubLinearIntegrity">
        <span className="stockHubLinearShield" aria-hidden="true"><ShieldIcon /></span>
        <div>
          <strong>{overview?.integrity === 'OK' ? 'Integridade automática OK' : 'Integridade a verificar'}</strong>
          <p>
            Os saldos são reconstruídos pelos movimentos guardados. Correções acrescentam registos em vez de apagar o histórico.
            A verificação é automática ao carregar estas áreas.
          </p>
          <small>Última leitura: {formatCheck(overview?.checkedAt)}</small>
        </div>
      </aside>

      <p className="stockHubLinearBackup">
        Cópias integrais e restauro ficam concentrados em <Link to="/mais">Mais</Link>, em vez de repetir botões em cada gestor.
      </p>
    </section>
  )
}
