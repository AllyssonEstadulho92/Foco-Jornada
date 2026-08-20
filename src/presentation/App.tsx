const layers = [
  ['Domínio', 'Regras de negócio puras'],
  ['Aplicação', 'Casos de uso e coordenação'],
  ['Infraestrutura', 'Persistência e integrações'],
  ['Apresentação', 'Interface responsiva'],
] as const

export function App() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-title">
        <span className="eyebrow">FUNDAÇÃO 0.1.0</span>
        <h1 id="app-title">Foco & Jornada</h1>
        <p>
          Projeto reiniciado do zero. Esta versão contém apenas a fundação técnica;
          nenhuma regra funcional da Jornada foi implementada ainda.
        </p>
        <div className="status" role="status">
          <span className="statusDot" aria-hidden="true" />
          Base limpa pronta para desenvolvimento
        </div>
      </section>

      <section className="panel" aria-labelledby="architecture-title">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">ARQUITETURA</span>
            <h2 id="architecture-title">Separação por camadas</h2>
          </div>
          <span className="badge">Sem código legado</span>
        </div>

        <div className="layerGrid">
          {layers.map(([title, description], index) => (
            <article className="layerCard" key={title}>
              <span className="layerNumber">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        Próximo gate: implementar exclusivamente o módulo Jornada e validar os testes antes de avançar.
      </footer>
    </main>
  )
}
