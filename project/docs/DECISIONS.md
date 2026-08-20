# Registo de Decisões Técnicas

Utilizar este ficheiro para decisões que afetem arquitetura, dados ou comportamento.

## ADR-001 — V1 local-first

**Estado:** aceite  
**Decisão:** a V1 não terá backend nem autenticação. IndexedDB será a fonte de verdade local.  
**Motivo:** reduzir complexidade inicial e validar o produto antes de introduzir sincronização remota.

## ADR-002 — Timers derivados de timestamps

**Estado:** aceite  
**Decisão:** jornadas, pausas, atividades e foco não usarão contadores acumulativos como fonte de verdade.  
**Motivo:** garantir recuperação correta após refresh, suspensão e reabertura.

## ADR-003 — Desenvolvimento faseado

**Estado:** aceite  
**Decisão:** cada módulo é implementado e validado antes da fase seguinte.  
**Motivo:** reduzir regressões e impedir que erros estruturais se propaguem.

## ADR-004 — Documentação de gestão concentrada em `project/`

**Estado:** aceite  
**Decisão:** especificação, roadmap, checkpoints, decisões, quality gates e prompts ficam em `project/`. O código de produção continua em `src/`.  
**Motivo:** separar claramente código, configuração e governação do projeto sem quebrar a estrutura técnica do Vite.

## ADR-005 — Zustand apenas para estado de interface nesta fundação

**Estado:** aceite  
**Decisão:** na Fase 1 o Zustand gere apenas estado efémero da interface, como o menu lateral. Dados de negócio persistentes serão introduzidos através de casos de uso e repositórios.  
**Motivo:** evitar transformar o store de UI na fonte de verdade das regras de negócio.

## ADR-006 — Dexie preparado sem antecipar tabelas de domínio

**Estado:** aceite  
**Decisão:** a Fundação cria a infraestrutura Dexie e uma tabela neutra de metadados; as tabelas de Jornada, Pausas, Atividades, Foco e Café serão adicionadas na fase correspondente.  
**Motivo:** evitar desenho prematuro do schema e manter migrações explicitamente ligadas aos módulos que as exigem.

## ADR-007 — Pausas descontadas do tempo efetivo e encerradas com a jornada

**Estado:** aceite  
**Decisão:** o tempo efetivo é calculado como duração da jornada menos todas as pausas não canceladas. Se a jornada for terminada durante uma pausa ativa, a pausa é encerrada no mesmo instante antes do encerramento da jornada.  
**Motivo:** impedir pausas órfãs, manter os totais consistentes e garantir recuperação determinística após reabertura.

## ADR-008 — Duração real da pausa persistida no encerramento

**Estado:** aceite  
**Decisão:** pausas concluídas guardam `actualDurationSeconds`, mantendo os timestamps como referência primária e o valor persistido como resultado consolidado.  
**Motivo:** simplificar agregações futuras e preservar o valor final mesmo depois de alterações de relógio da interface.

## ADR-009 — Apenas uma atividade ativa por jornada

**Estado:** aceite  
**Decisão:** uma nova atividade só pode ser iniciada quando não existir outra atividade em estado `active` na mesma jornada. O utilizador deve concluir ou cancelar a atividade atual antes de iniciar outra.  
**Motivo:** evitar sobreposição de tempos e manter a atribuição de trabalho inequívoca.

## ADR-010 — Atividade ativa é concluída ao terminar a jornada

**Estado:** aceite  
**Decisão:** ao terminar uma jornada, qualquer atividade ativa é concluída no mesmo timestamp antes do encerramento da jornada.  
**Motivo:** impedir atividades órfãs e manter a duração da atividade limitada à jornada onde foi criada.

---

## Modelo para novas decisões

```text
## ADR-XXX — Título

Estado: proposta | aceite | rejeitada | substituída

Contexto:

Decisão:

Consequências:
```
