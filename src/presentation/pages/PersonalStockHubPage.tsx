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

export function PersonalStockHubPage() {
  return (
    <section className="personalStockPage" aria-labelledby="personal-stock-title">
      <header className="personalStockHeader">
        <span className="eyebrow">STOCK PESSOAL</span>
        <h1 id="personal-stock-title">Contagens auditáveis</h1>
        <p>Dois gestores locais, separados da jornada e com histórico próprio de movimentos.</p>
      </header>

      <div className="stockAppGrid">
        <Link to="/medicamentos" className="stockAppCard">
          <span className="stockAppGlyph" aria-hidden="true"><MedicationIcon /></span>
          <div>
            <strong>Gestor de Medicamentos</strong>
            <p>Stock real, horários, tomas confirmadas e autonomia por simulação cronológica.</p>
          </div>
          <span className="stockAppChevron" aria-hidden="true"><ChevronIcon /></span>
        </Link>

        <Link to="/sticks" className="stockAppCard">
          <span className="stockAppGlyph" aria-hidden="true"><SticksIcon /></span>
          <div>
            <strong>Controlo de Sticks glo</strong>
            <p>Contagem inteira, utilização +1, reposições, desfazer e reconciliação do ledger.</p>
          </div>
          <span className="stockAppChevron" aria-hidden="true"><ChevronIcon /></span>
        </Link>
      </div>

      <aside className="stockIntegrityNote">
        <strong>Regra de integridade</strong>
        <p>O stock mostrado é reconstruído pelos movimentos guardados. A interface não reduz nem aumenta o saldo por conta própria.</p>
      </aside>
    </section>
  )
}
