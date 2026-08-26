import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppServices } from '../providers/AppServicesProvider'

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

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
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

function LedgerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  )
}

function LocalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 7 4-7 4-7-4 7-4Z" />
      <path d="m5 7v8l7 4 7-4V7M12 11v8" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6v5h5" />
      <path d="M5.5 9.2a7.5 7.5 0 1 1-.6 6.2" />
      <path d="M12 8v4.2l2.7 1.7" />
    </svg>
  )
}

function BackupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5h11l3 3V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z" />
      <path d="M7 5.5v5h8v-5M8 17h8" />
    </svg>
  )
}

type TrustView = 'managers' | 'ledger' | 'integrity' | 'history' | 'protection'

interface RecentStockItem {
  id: string
  area: string
  label: string
  at: string
}

interface StockHubOverview {
  integrity: 'OK' | 'INCONSISTÊNCIA'
  sticksInitialized: boolean
  sticksMovements: number
  medicationCount: number
  medicationMovements: number
  stockBackupRecords: number
  metadataRecords: number
  recent: RecentStockItem[]
  checkedAt: string
}

function stickMovementLabel(type: string): string {
  if (type === 'initial_stock') return 'Stock inicial'
  if (type === 'consumption') return 'Stick utilizado'
  if (type === 'restock') return 'Reposição de sticks'
  return 'Correção de sticks'
}

function doseEventLabel(status: string): string {
  if (status === 'taken') return 'Toma confirmada'
  if (status === 'not_taken') return 'Toma não tomada'
  if (status === 'postponed') return 'Toma adiada'
  return 'Correção de toma'
}

function formatAuditTime(value: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function PersonalStockHubPage() {
  const { personalStockService, backupService } = useAppServices()
  const loadingRef = useRef(false)
  const [activeView, setActiveView] = useState<TrustView>('integrity')
  const [overview, setOverview] = useState<StockHubOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const refreshOverview = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setMessage('')
    try {
      const [diagnostic, medications, stickMovements, backup] = await Promise.all([
        personalStockService.diagnostic(),
        personalStockService.listMedications(),
        personalStockService.listStickMovements(8),
        backupService.createPayload(),
      ])
      const medicationEventGroups = await Promise.all(
        medications.map((item) => personalStockService.listDoseEvents(item.medication.id)),
      )
      const medicationNameById = new Map(
        medications.map((item) => [item.medication.id, item.medication.name]),
      )
      const recentMedicationEvents = medicationEventGroups
        .flat()
        .map((event) => ({
          id: event.id,
          area: medicationNameById.get(event.medicationId) ?? 'Medicamento',
          label: doseEventLabel(event.status),
          at: event.createdAt,
        }))
      const recentStickEvents = stickMovements.map((movement) => ({
        id: movement.id,
        area: 'Sticks glo',
        label: stickMovementLabel(movement.type),
        at: movement.createdAt,
      }))
      const recent = [...recentStickEvents, ...recentMedicationEvents]
        .sort((left, right) => right.at.localeCompare(left.at) || right.id.localeCompare(left.id))
        .slice(0, 8)

      setOverview({
        integrity: diagnostic.integrity,
        sticksInitialized: diagnostic.sticks !== null,
        sticksMovements: diagnostic.sticks?.movementCount ?? 0,
        medicationCount: diagnostic.medications.length,
        medicationMovements: diagnostic.medications.reduce(
          (total, item) => total + item.reconciliation.movementCount,
          0,
        ),
        stockBackupRecords: backup.tables.stockEntities.length
          + backup.tables.stockMovements.length
          + backup.tables.medicationSchedules.length
          + backup.tables.medicationDoseEvents.length,
        metadataRecords: backup.tables.metadata.length,
        recent,
        checkedAt: new Date().toISOString(),
      })
      setMessage('Dados verificados diretamente na base local, sem alterar qualquer registo.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível verificar o stock pessoal.')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [backupService, personalStockService])

  useEffect(() => {
    void refreshOverview()
  }, [refreshOverview])

  const totalMovements = (overview?.sticksMovements ?? 0) + (overview?.medicationMovements ?? 0)

  return (
    <section className="personalStockPage personalStockHubPage" aria-labelledby="personal-stock-title">
      <header className="personalStockHeader stockHubHeader">
        <span className="eyebrow">STOCK PESSOAL</span>
        <div className="stockHubTitleRow">
          <h1 id="personal-stock-title">Contagens auditáveis</h1>
          <span className="stockHubTitleIcon" aria-hidden="true"><ShieldIcon /></span>
        </div>
        <p>Dois gestores locais, separados da jornada e com histórico próprio de movimentos.</p>
      </header>

      <div className="stockHubAppGrid">
        <Link to="/medicamentos" className="stockAppCard stockHubAppCard">
          <span className="stockAppGlyph stockHubGlyph" aria-hidden="true"><MedicationIcon /></span>
          <div className="stockHubCardCopy">
            <strong>Gestor de Medicamentos</strong>
            <p>Stock real, horários, tomas confirmadas e autonomia por simulação cronológica.</p>
          </div>
          <span className="stockAppChevron stockHubChevron" aria-hidden="true"><ChevronIcon /></span>
        </Link>

        <Link to="/sticks" className="stockAppCard stockHubAppCard">
          <span className="stockAppGlyph stockHubGlyph" aria-hidden="true"><SticksIcon /></span>
          <div className="stockHubCardCopy">
            <strong>Controlo de Sticks glo</strong>
            <p>Contagem inteira, utilização +1, reposições, desfazer e reconciliação do ledger.</p>
          </div>
          <span className="stockAppChevron stockHubChevron" aria-hidden="true"><ChevronIcon /></span>
        </Link>
      </div>

      <aside className="stockIntegrityNote stockHubIntegrityNote">
        <span className="stockHubIntegrityIcon" aria-hidden="true"><ShieldIcon /></span>
        <div>
          <strong>Regra de integridade</strong>
          <p>
            O stock mostrado é reconstruído pelos movimentos guardados. Correções criam novos registos em vez de apagar o histórico;
            a cópia integral inclui também horários, eventos de toma, notas e configurações.
          </p>
        </div>
      </aside>

      <div className="stockHubTrustStrip stockHubTrustStripFunctional" role="tablist" aria-label="Verificações do stock pessoal">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'managers'}
          className={`stockHubTrustItem stockHubTrustButton${activeView === 'managers' ? ' stockHubTrustButtonActive' : ''}`}
          onClick={() => setActiveView('managers')}
        >
          <span aria-hidden="true"><LocalIcon /></span>
          <strong>2 gestores</strong>
          <small>Abrir e verificar</small>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'ledger'}
          className={`stockHubTrustItem stockHubTrustButton${activeView === 'ledger' ? ' stockHubTrustButtonActive' : ''}`}
          onClick={() => setActiveView('ledger')}
        >
          <span aria-hidden="true"><LedgerIcon /></span>
          <strong>Ledger</strong>
          <small>{totalMovements} movimentos</small>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'integrity'}
          className={`stockHubTrustItem stockHubTrustButton${activeView === 'integrity' ? ' stockHubTrustButtonActive' : ''}`}
          onClick={() => setActiveView('integrity')}
        >
          <span aria-hidden="true"><ShieldIcon /></span>
          <strong>{overview?.integrity ?? 'A verificar'}</strong>
          <small>Saldo reconstruído</small>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'history'}
          className={`stockHubTrustItem stockHubTrustButton${activeView === 'history' ? ' stockHubTrustButtonActive' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <span aria-hidden="true"><HistoryIcon /></span>
          <strong>Histórico</strong>
          <small>Ver alterações</small>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'protection'}
          className={`stockHubTrustItem stockHubTrustButton${activeView === 'protection' ? ' stockHubTrustButtonActive' : ''}`}
          onClick={() => setActiveView('protection')}
        >
          <span aria-hidden="true"><BackupIcon /></span>
          <strong>Proteção</strong>
          <small>Cópia integral</small>
        </button>
      </div>

      <section className="stockHubFunctionalPanel" role="tabpanel" aria-live="polite">
        <div className="stockHubFunctionalPanelHeader">
          <div>
            <span className="stockPanelTag">VERIFICAÇÃO REAL</span>
            <h2>
              {activeView === 'managers' ? 'Gestores disponíveis'
                : activeView === 'ledger' ? 'Movimentos do ledger'
                  : activeView === 'integrity' ? 'Estado de integridade'
                    : activeView === 'history' ? 'Últimas alterações guardadas'
                      : 'Proteção e cópia dos dados'}
            </h2>
          </div>
          <button type="button" disabled={loading} onClick={() => void refreshOverview()}>
            {loading ? 'A verificar…' : 'Verificar agora'}
          </button>
        </div>

        {activeView === 'managers' ? (
          <div className="stockHubFunctionalLinks">
            <Link to="/medicamentos">
              <span>Medicamentos · {overview?.medicationCount ?? 0} registados</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/sticks">
              <span>Sticks glo · {overview?.sticksInitialized ? 'ledger ativo' : 'por iniciar'}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}

        {activeView === 'ledger' ? (
          <div className="stockHubFunctionalGrid">
            <div className="stockHubFunctionalMetric">
              <span>Sticks</span>
              <strong>{overview?.sticksMovements ?? 0}</strong>
              <small>movimentos guardados</small>
            </div>
            <div className="stockHubFunctionalMetric">
              <span>Medicamentos</span>
              <strong>{overview?.medicationMovements ?? 0}</strong>
              <small>movimentos guardados</small>
            </div>
            <div className="stockHubFunctionalMetric">
              <span>Total</span>
              <strong>{totalMovements}</strong>
              <small>operações reconstruíveis</small>
            </div>
          </div>
        ) : null}

        {activeView === 'integrity' ? (
          <>
            <div className="stockHubFunctionalGrid">
              <div className="stockHubFunctionalMetric">
                <span>Resultado</span>
                <strong>{overview?.integrity ?? 'A verificar'}</strong>
                <small>todos os ledgers</small>
              </div>
              <div className="stockHubFunctionalMetric">
                <span>Medicamentos</span>
                <strong>{overview?.medicationCount ?? 0}</strong>
                <small>entidades verificadas</small>
              </div>
              <div className="stockHubFunctionalMetric">
                <span>Última verificação</span>
                <strong>{overview?.checkedAt ? formatAuditTime(overview.checkedAt) : '—'}</strong>
                <small>sem alterar dados</small>
              </div>
            </div>
            <p className="stockHubFunctionalNote">
              Um resultado OK significa que cada saldo final coincide com a soma sequencial de stock inicial, entradas, consumos e correções.
            </p>
          </>
        ) : null}

        {activeView === 'history' ? (
          overview?.recent.length ? (
            <div className="stockHubFunctionalHistory">
              {overview.recent.map((item) => (
                <article key={item.id}>
                  <div><strong>{item.label}</strong><small>{item.area}</small></div>
                  <small>{formatAuditTime(item.at)}</small>
                </article>
              ))}
            </div>
          ) : <p className="stockHubFunctionalEmpty">Ainda não existem alterações guardadas no stock pessoal.</p>
        ) : null}

        {activeView === 'protection' ? (
          <>
            <div className="stockHubFunctionalGrid">
              <div className="stockHubFunctionalMetric">
                <span>Stock no backup</span>
                <strong>{overview?.stockBackupRecords ?? 0}</strong>
                <small>entidades, movimentos, horários e tomas</small>
              </div>
              <div className="stockHubFunctionalMetric">
                <span>Notas/configurações</span>
                <strong>{overview?.metadataRecords ?? 0}</strong>
                <small>registos de metadata incluídos</small>
              </div>
              <div className="stockHubFunctionalMetric">
                <span>Restauro</span>
                <strong>Validado</strong>
                <small>antes de substituir dados locais</small>
              </div>
            </div>
            <div className="stockHubFunctionalLinks">
              <Link to="/mais">
                <span>Abrir cópia de segurança e restauro</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="stockHubFunctionalNote">
              As correções normais preservam o registo anterior. Para proteção contra perda do dispositivo ou limpeza do navegador,
              mantém também uma cópia integral externa atualizada.
            </p>
          </>
        ) : null}

        {message ? <p className="stockHubFunctionalNote" role="status">{message}</p> : null}
      </section>
    </section>
  )
}
