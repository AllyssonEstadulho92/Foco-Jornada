import { Link } from 'react-router-dom'

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
          <span className="stockAppGlyph" aria-hidden="true">◒</span>
          <div>
            <strong>Gestor de Medicamentos</strong>
            <p>Stock real, horários, tomas confirmadas e autonomia por simulação cronológica.</p>
          </div>
          <span aria-hidden="true">›</span>
        </Link>

        <Link to="/sticks" className="stockAppCard">
          <span className="stockAppGlyph" aria-hidden="true">▥</span>
          <div>
            <strong>Controlo de Sticks glo</strong>
            <p>Contagem inteira, utilização +1, reposições, desfazer e reconciliação do ledger.</p>
          </div>
          <span aria-hidden="true">›</span>
        </Link>
      </div>

      <aside className="stockIntegrityNote">
        <strong>Regra de integridade</strong>
        <p>O stock mostrado é reconstruído pelos movimentos guardados. A interface não reduz nem aumenta o saldo por conta própria.</p>
      </aside>
    </section>
  )
}
