import { Link } from 'react-router-dom'

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

export function PersonalStockHubPage() {
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
          <p>O stock mostrado é reconstruído pelos movimentos guardados. A interface não reduz nem aumenta o saldo por conta própria.</p>
        </div>
      </aside>

      <div className="stockHubTrustStrip" aria-label="Características do stock pessoal">
        <div className="stockHubTrustItem">
          <span aria-hidden="true"><LocalIcon /></span>
          <strong>2 gestores</strong>
          <small>Locais e separados</small>
        </div>
        <div className="stockHubTrustItem">
          <span aria-hidden="true"><LedgerIcon /></span>
          <strong>Ledger</strong>
          <small>Auditável</small>
        </div>
        <div className="stockHubTrustItem">
          <span aria-hidden="true"><ShieldIcon /></span>
          <strong>Exato</strong>
          <small>Saldo reconstruído</small>
        </div>
        <div className="stockHubTrustItem">
          <span aria-hidden="true"><HistoryIcon /></span>
          <strong>Histórico</strong>
          <small>Movimentos guardados</small>
        </div>
      </div>
    </section>
  )
}
