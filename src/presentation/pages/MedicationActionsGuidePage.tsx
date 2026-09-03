import { Link } from 'react-router-dom'
import { AppIcon } from '../components/ui/AppIcon'

export function MedicationActionsGuidePage() {
  return (
    <section className="reportPage guidePage" aria-labelledby="medication-guide-title">
      <header className="reportHeader guideHeader">
        <div>
          <span className="eyebrow">AJUDA · MEDICAMENTOS</span>
          <h1 id="medication-guide-title">Guia das tomas programadas</h1>
          <p>Explicação dos estados, botões e histórico usados pelo Foco Jornada.</p>
        </div>
      </header>

      <section className="guideQuickStart" aria-labelledby="medication-guide-flow-title">
        <div>
          <span className="sectionKicker">FLUXO RÁPIDO</span>
          <h2 id="medication-guide-flow-title">O que aparece em cada toma</h2>
        </div>
        <div className="guideFlow" aria-label="Fluxo das tomas programadas">
          <span>1. Pendente</span>
          <span>2. Tomada</span>
          <span>3. Adiar</span>
          <span>4. Não tomada</span>
          <span>5. Corrigir</span>
          <span>6. Ver histórico</span>
        </div>
      </section>

      <div className="guideSections">
        <details className="guideCard" open>
          <summary>
            <span><strong>Estados apresentados</strong><small>O estado muda conforme os registos feitos na aplicação.</small></span>
            <span className="guideChevron" aria-hidden="true"><AppIcon name="chevron-down" /></span>
          </summary>
          <div className="guideCardBody">
            <div className="guideExample">
              <strong>PENDENTE</strong>
              <span>A hora ainda não passou e ainda não existe um registo para a ocorrência.</span>
            </div>
            <div className="guideExample">
              <strong>ATRASADA</strong>
              <span>A hora passou sem registo. É apenas um aviso automático e não altera o stock.</span>
            </div>
            <div className="guideExample">
              <strong>ADIADA</strong>
              <span>Foi escolhida uma nova hora. O adiamento, por si só, não altera o stock.</span>
            </div>
            <div className="guideExample">
              <strong>TOMADA</strong>
              <span>A ocorrência foi confirmada e a quantidade programada foi descontada uma vez.</span>
            </div>
            <div className="guideExample">
              <strong>NÃO TOMADA</strong>
              <span>A ocorrência fica registada sem consumo de stock.</span>
            </div>
          </div>
        </details>

        <details className="guideCard">
          <summary>
            <span><strong>Ações rápidas</strong><small>As ações principais ficam visíveis; as secundárias ficam no menu ···.</small></span>
            <span className="guideChevron" aria-hidden="true"><AppIcon name="chevron-down" /></span>
          </summary>
          <div className="guideCardBody">
            <p><strong>Tomada / Tomada agora</strong> confirma a ocorrência e regista o consumo correspondente.</p>
            <p><strong>Adiar</strong> abre atalhos de +15 min, +30 min, +1 h e a opção de escolher uma hora manualmente.</p>
            <p><strong>Alterar hora</strong> substitui a hora ativa de uma ocorrência adiada, mantendo o adiamento anterior no histórico.</p>
            <p><strong>Menu ···</strong> reúne Não tomada, Corrigir e Ver detalhes e histórico.</p>
            <p>Os atalhos de tempo são apenas controlos de agenda da aplicação.</p>
          </div>
        </details>

        <details className="guideCard">
          <summary>
            <span><strong>Correções e histórico</strong><small>Os registos anteriores não são apagados silenciosamente.</small></span>
            <span className="guideChevron" aria-hidden="true"><AppIcon name="chevron-down" /></span>
          </summary>
          <div className="guideCardBody">
            <p>Quando corriges uma toma ou um adiamento, o Foco Jornada acrescenta um evento de correção e mantém o registo original.</p>
            <p>Em <strong>Ver detalhes e histórico</strong> podes consultar o estado atual, a hora original, a quantidade, o efeito no stock e a sequência de eventos daquela ocorrência.</p>
            <div className="guideExample">
              <strong>Exemplo de histórico</strong>
              <span>08:00 · ocorrência criada pelo horário.</span>
              <span>ADIADA · nova hora 10:30.</span>
              <span>CORREÇÃO · adiamento substituído.</span>
              <span>ADIADA · nova hora 11:00.</span>
              <span>TOMADA REAGENDADA · consumo registado uma vez.</span>
            </div>
          </div>
        </details>

        <details className="guideCard">
          <summary>
            <span><strong>Relação com o stock</strong><small>O saldo continua baseado no ledger auditável.</small></span>
            <span className="guideChevron" aria-hidden="true"><AppIcon name="chevron-down" /></span>
          </summary>
          <div className="guideCardBody">
            <p><strong>Adiar</strong> e <strong>Não tomada</strong> não descontam stock.</p>
            <p><strong>Tomada</strong> desconta exatamente a quantidade definida naquele horário.</p>
            <p>Uma correção de uma toma confirmada devolve a quantidade através de um movimento de correção, sem apagar o consumo original.</p>
            <p>A contagem física continua disponível para comparar o saldo digital com a quantidade existente.</p>
          </div>
        </details>
      </div>

      <aside className="guidePrivacy">
        <strong>Guia operacional</strong>
        <p>Esta página explica apenas como os controlos e os registos da aplicação funcionam. Não altera horários prescritos nem fornece orientação clínica.</p>
      </aside>

      <Link className="guideAction" to="/medicamentos">Voltar a Medicamentos</Link>
    </section>
  )
}
