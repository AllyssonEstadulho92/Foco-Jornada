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

---

## Modelo para novas decisões

```text
## ADR-XXX — Título

Estado: proposta | aceite | rejeitada | substituída

Contexto:

Decisão:

Consequências:
```
