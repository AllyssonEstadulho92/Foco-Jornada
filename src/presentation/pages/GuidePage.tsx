import { Link } from 'react-router-dom'
import { AppIcon } from '../components/ui/AppIcon'

const sections = [
  {
    id: 'primeiros-passos',
    title: '1. Primeiros passos',
    summary: 'Define o horário e prepara a aplicação para o teu dia.',
    content: (
      <>
        <p>Antes do primeiro uso, abre <strong>Definições</strong> e confirma o horário base, as pausas e os fins de semana em que trabalhas.</p>
        <p>Exemplo: entrada 08:00, pausa 12:00–12:15 e saída 17:00.</p>
        <Link className="guideAction" to="/definicoes">Abrir Definições</Link>
      </>
    ),
  },
  {
    id: 'hoje',
    title: '2. Hoje',
    summary: 'Acompanha a jornada e regista o que acontece ao longo do dia.',
    content: (
      <>
        <ol>
          <li>Ao chegar, toca em <strong>Iniciar jornada</strong>.</li>
          <li>Acompanha a entrada, o tempo efetivo, as pausas e a saída prevista.</li>
          <li>Durante o dia, regista pausas, atividades, foco e café.</li>
          <li>No fim do turno, toca em <strong>Terminar jornada</strong>.</li>
        </ol>
        <p>O horário previsto e os registos reais ficam separados para poderes comparar o plano com o que aconteceu.</p>
        <Link className="guideAction" to="/">Abrir Hoje</Link>
      </>
    ),
  },
  {
    id: 'pausas',
    title: '3. Pausas',
    summary: 'Regista os intervalos que não contam como trabalho efetivo.',
    content: (
      <>
        <p>Ao sair para uma pausa, inicia-a na aplicação. Quando regressares, termina-a. Esse intervalo deixa de contar no tempo efetivo.</p>
        <p>Se tiveres uma pausa definida no horário base, o ecrã Hoje mostra a hora prevista.</p>
      </>
    ),
  },
  {
    id: 'atividades',
    title: '4. Atividades',
    summary: 'Organiza as tarefas e acompanha quanto tempo gastas em cada uma.',
    content: (
      <>
        <p>Em <strong>Atividades</strong> podes adicionar uma tarefa, iniciar, concluir, editar ou cancelar.</p>
        <p>A aplicação mantém apenas uma atividade ativa de cada vez para não duplicar a contagem.</p>
        <Link className="guideAction" to="/atividades">Abrir Atividades</Link>
      </>
    ),
  },
  {
    id: 'foco',
    title: '5. Foco',
    summary: 'Usa Pomodoro ou escolhe o teu próprio tempo de concentração.',
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
    summary: 'Vê o que aconteceu em cada dia e corrige registos quando necessário.',
    content: (
      <>
        <p>Escolhe um dia para consultar jornada, pausas, atividades, foco e cafés.</p>
        <p>Os registos concluídos podem ser eliminados. A eliminação é definitiva neste dispositivo.</p>
        <Link className="guideAction" to="/historico">Abrir Histórico</Link>
      </>
    ),
  },
  {
    id: 'notificacoes',
    title: '7. Notificações',
    summary: 'Consulta confirmações, avisos e alertas no sino.',
    content: (
      <>
        <p>Quando existe um aviso novo, o sino mostra um indicador vermelho. Abre-o para ver as mensagens da aplicação.</p>
        <p>Podes editar ou eliminar notificações guardadas e limpar a lista quando quiseres.</p>
      </>
    ),
  },
  {
    id: 'horas',
    title: '8. Horas & ausências',
    summary: 'Compara o horário previsto com as horas realmente trabalhadas.',
    content: (
      <>
        <p>Podes preencher os horários manualmente ou usar <strong>Importar jornada</strong> para aproveitar a entrada, saída e pausas já registadas.</p>
        <p>Se existir uma ausência, indica o motivo, o início, o fim e o comprovativo quando se aplicar.</p>
        <div className="guideExample">
          <strong>Exemplo — saída por doença</strong>
          <span>Horário: 08:00–17:00 · pausa 12:00–12:15</span>
          <span>Saída real: 14:00</span>
          <span>Previstas: 08:45 · Trabalhadas: 05:45 · Não trabalhadas: 03:00</span>
        </div>
        <p>A aplicação calcula o tempo ao minuto. O efeito no vencimento depende do tipo de ausência e dos dados laborais aplicáveis.</p>
        <Link className="guideAction" to="/horas">Abrir Horas</Link>
      </>
    ),
  },
  {
    id: 'vencimento',
    title: '9. Vencimento',
    summary: 'Consulta a estimativa do que vais receber.',
    content: (
      <>
        <p>O cálculo usa os dias de trabalho, folgas, feriados, férias, faltas, horas extra e os dados salariais guardados.</p>
        <p>Usa a estimativa para conferência pessoal e compara-a com o recibo emitido pela entidade empregadora.</p>
        <Link className="guideAction" to="/vencimento">Abrir Vencimento</Link>
      </>
    ),
  },
  {
    id: 'estatisticas-exportar',
    title: '10. Relatórios e dados',
    summary: 'Acompanha os teus resultados e guarda uma cópia dos dados.',
    content: (
      <>
        <p>Em <strong>Relatórios</strong> podes consultar o resumo de hoje, da semana e do mês.</p>
        <p>Em <strong>Mais</strong> podes exportar os dados do dia e verificar o estado da aplicação.</p>
        <Link className="guideAction" to="/estatisticas">Abrir Relatórios</Link>
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
          <h1 id="guide-title">Guia</h1>
          <p>Aprende a usar o Foco Jornada passo a passo.</p>
        </div>
      </header>

      <section className="guideQuickStart" aria-labelledby="guide-quick-title">
        <div>
          <span className="sectionKicker">COMEÇAR</span>
          <h2 id="guide-quick-title">O teu dia na aplicação</h2>
        </div>
        <div className="guideFlow" aria-label="Fluxo diário">
          <span>1. Definir horário</span>
          <span>2. Iniciar jornada</span>
          <span>3. Registar o dia</span>
          <span>4. Terminar jornada</span>
          <span>5. Rever histórico</span>
          <span>6. Conferir horas</span>
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
              <span className="guideChevron" aria-hidden="true"><AppIcon name="chevron-down" /></span>
            </summary>
            <div className="guideCardBody">{section.content}</div>
          </details>
        ))}
      </div>

      <aside className="guidePrivacy">
        <strong>Os teus dados ficam neste dispositivo</strong>
        <p>A versão atual guarda os dados localmente. Exporta uma cópia antes de limpares os dados do navegador ou mudares de dispositivo.</p>
      </aside>
    </section>
  )
}
