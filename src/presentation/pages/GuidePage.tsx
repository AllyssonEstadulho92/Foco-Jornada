import { Link } from 'react-router-dom'

const sections = [
  {
    id: 'primeiros-passos',
    title: '1. Primeiros passos',
    summary: 'Configura o horário e prepara a aplicação para o teu dia de trabalho.',
    content: (
      <>
        <p>Antes do primeiro uso, abre <strong>Mais → Definições</strong> e confirma o teu horário fixo, pausas, moeda e restantes preferências.</p>
        <p>Exemplo: entrada 08:00, pausa 11:00–11:15 e saída 17:00.</p>
        <Link className="guideAction" to="/definicoes">Abrir Definições</Link>
      </>
    ),
  },
  {
    id: 'hoje',
    title: '2. Hoje — jornada diária',
    summary: 'Usa este ecrã como painel principal durante o turno.',
    content: (
      <>
        <ol>
          <li>Ao chegar, toca em <strong>Iniciar jornada</strong>.</li>
          <li>Acompanha entrada real, jornada, tempo efetivo, próxima pausa e saída prevista.</li>
          <li>Durante o dia, regista pausas, atividades, foco e café.</li>
          <li>No fim do turno, toca em <strong>Terminar jornada</strong>.</li>
        </ol>
        <p>O horário planeado e os registos reais são mantidos separados. Assim consegues comparar o que estava previsto com o que realmente aconteceu.</p>
        <Link className="guideAction" to="/">Abrir Hoje</Link>
      </>
    ),
  },
  {
    id: 'pausas',
    title: '3. Pausas',
    summary: 'Regista corretamente o tempo que não conta como trabalho efetivo.',
    content: (
      <>
        <p>Ao sair para uma pausa, inicia a pausa na aplicação. Ao regressar, termina-a. O tempo da pausa deixa de contar no tempo efetivo.</p>
        <p>Se existir uma pausa planeada, o painel Hoje apresenta a hora prevista de saída e a hora de regresso.</p>
      </>
    ),
  },
  {
    id: 'atividades',
    title: '4. Atividades',
    summary: 'Organiza o trabalho e mede quanto tempo gastas em cada tarefa.',
    content: (
      <>
        <p>Em <strong>Atividades</strong> podes criar uma tarefa, adicionar descrição, iniciar, concluir ou cancelar.</p>
        <p>A aplicação evita duas atividades ativas ao mesmo tempo para não duplicar a contagem.</p>
        <Link className="guideAction" to="/atividades">Abrir Atividades</Link>
      </>
    ),
  },
  {
    id: 'foco',
    title: '5. Foco / Pomodoro',
    summary: 'Trabalha em blocos de concentração e associa o foco a uma atividade.',
    content: (
      <>
        <p>O modo Pomodoro usa 25 minutos de foco, 5 minutos de pausa curta e 15 minutos de pausa longa após o 4.º ciclo. Também podes escolher uma duração personalizada.</p>
        <p>Uma sessão pode ser pausada, retomada, concluída ou cancelada.</p>
        <Link className="guideAction" to="/foco">Abrir Foco</Link>
      </>
    ),
  },
  {
    id: 'historico',
    title: '6. Histórico',
    summary: 'Confere o que aconteceu em cada dia e limpa registos quando necessário.',
    content: (
      <>
        <p>Seleciona um dia para consultar a timeline de jornada, pausas, atividades, foco e cafés.</p>
        <p>Registos concluídos podem ser eliminados. A eliminação é definitiva no dispositivo, por isso usa-a apenas quando tens a certeza.</p>
        <Link className="guideAction" to="/historico">Abrir Histórico</Link>
      </>
    ),
  },
  {
    id: 'notificacoes',
    title: '7. Centro de notificações',
    summary: 'Todos os avisos da aplicação ficam concentrados no sino.',
    content: (
      <>
        <p>Quando existe um aviso novo, o sino apresenta um indicador vermelho. Abre o centro para ler confirmações, erros e alertas de jornada.</p>
        <p>Podes marcar as notificações como lidas, remover uma notificação ou limpar o centro.</p>
      </>
    ),
  },
  {
    id: 'horas',
    title: '8. Calculadora de horas & ausências',
    summary: 'Controla horas previstas, trabalhadas, não trabalhadas, doença e horas extra.',
    content: (
      <>
        <p>Podes preencher tudo manualmente ou usar <strong>Importar jornada do dia</strong> para aproveitar a entrada, saída e pausas já registadas na aplicação.</p>
        <p>Regista o motivo da ocorrência, o início e fim da ausência e, quando aplicável, o comprovativo.</p>
        <div className="guideExample">
          <strong>Exemplo — saída por doença</strong>
          <span>Horário: 08:00–17:00 · pausa 11:00–11:15</span>
          <span>Saída real: 14:00</span>
          <span>Previstas: 08:45 · Trabalhadas: 05:45 · Não trabalhadas: 03:00</span>
        </div>
        <p>A aplicação calcula o tempo. A classificação remuneratória deve ser confirmada conforme o contrato, documentação e regras aplicáveis.</p>
        <Link className="guideAction" to="/horas">Abrir Calculadora de horas</Link>
      </>
    ),
  },
  {
    id: 'vencimento',
    title: '9. Vencimento & planificação',
    summary: 'Planeia o mês e obtém uma estimativa do valor a receber.',
    content: (
      <>
        <p>Marca dias de trabalho, folga, feriado, férias, faltas e horas extra. Confirma também remuneração base, subsídio de alimentação, Segurança Social, IRS, abonos e descontos.</p>
        <p>A estimativa serve para controlo pessoal. O recibo oficial emitido pela entidade empregadora é a referência final.</p>
        <Link className="guideAction" to="/vencimento">Abrir Vencimento</Link>
      </>
    ),
  },
  {
    id: 'estatisticas-exportar',
    title: '10. Estatísticas e exportação',
    summary: 'Consulta tendências e mantém um arquivo dos teus dados.',
    content: (
      <>
        <p>Em <strong>Estatísticas</strong> podes consultar os totais de hoje, 7 dias e 30 dias.</p>
        <p>Em <strong>Mais → Exportar o dia</strong> podes guardar um relatório JSON para arquivo ou análise posterior.</p>
        <Link className="guideAction" to="/estatisticas">Abrir Estatísticas</Link>
      </>
    ),
  },
]

export function GuidePage() {
  return (
    <section className="reportPage guidePage" aria-labelledby="guide-title">
      <header className="reportHeader guideHeader">
        <div>
          <span className="eyebrow">AJUDA</span>
          <h1 id="guide-title">Guia de utilização</h1>
          <p>Um percurso simples para usar o Foco & Jornada corretamente no dia a dia.</p>
        </div>
      </header>

      <section className="guideQuickStart" aria-labelledby="guide-quick-title">
        <div>
          <span className="sectionKicker">COMEÇAR</span>
          <h2 id="guide-quick-title">Fluxo diário recomendado</h2>
        </div>
        <div className="guideFlow" aria-label="Fluxo diário">
          <span>1. Configurar</span>
          <span>2. Iniciar jornada</span>
          <span>3. Registar o dia</span>
          <span>4. Terminar jornada</span>
          <span>5. Conferir histórico</span>
          <span>6. Registar ocorrências</span>
        </div>
      </section>

      <div className="guideSections">
        {sections.map((section, index) => (
          <details className="guideCard" key={section.id} open={index === 0}>
            <summary>
              <span>
                <strong>{section.title}</strong>
                <small>{section.summary}</small>
              </span>
              <span className="guideChevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="guideCardBody">{section.content}</div>
          </details>
        ))}
      </div>

      <aside className="guidePrivacy">
        <strong>Dados guardados no dispositivo</strong>
        <p>A versão atual é local-first. Limpar os dados do navegador pode apagar informação local. Usa a exportação quando quiseres manter um arquivo adicional.</p>
      </aside>
    </section>
  )
}
