# Checkpoint do Projeto

## Estado atual

**Fase:** 3 — Pausas concluída  
**Próxima fase:** 4 — Atividades  
**PR da Fase 3:** #8  
**Validação CI:** GitHub Actions run `32412743237` — sucesso  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Fases concluídas

- [x] Fase 0 — Especificação.
- [x] Fase 1 — Fundação.
- [x] Fase 2 — Jornada.
- [x] Fase 3 — Pausas.

## Implementado e validado na Fase 3

- [x] Entidade `BreakRecord` e regras puras de domínio.
- [x] Pausa curta de 15 minutos.
- [x] Pausa longa de 60 minutos.
- [x] Pausa personalizada.
- [x] Apenas uma pausa ativa por jornada.
- [x] Pausas só podem ser iniciadas com jornada ativa.
- [x] Proteção contra criação concorrente de pausas.
- [x] Proteção contra dupla finalização.
- [x] Duração real persistida em `actualDurationSeconds`.
- [x] Dexie schema v3 com tabela `breaks`.
- [x] Repositório Dexie para pausas.
- [x] Recuperação de pausa ativa após refresh/reabertura.
- [x] Tempo efetivo calculado por timestamps e pausas persistidas.
- [x] Pausa ativa encerrada automaticamente ao terminar a jornada.
- [x] Interface de pausas integrada no ecrã Hoje.
- [x] Estado visual `Em pausa`.
- [x] Histórico de pausas da jornada ativa.
- [x] Testes de domínio.
- [x] Testes dos casos de uso.
- [x] Testes do cálculo de tempo efetivo.
- [x] Testes de persistência e concorrência IndexedDB.

## Resultado dos quality gates

- Typecheck: **PASS**
- Lint: **PASS**
- Testes: **PASS**
- Build: **PASS**

## Próximo trabalho autorizado

A Fase 4 — Atividades pode iniciar depois de a PR #8 ser integrada em `main`.

Escopo: criar, editar, iniciar, concluir e cancelar atividades; permitir apenas uma atividade ativa; persistir em IndexedDB; calcular duração por timestamps; integrar com a jornada sem colocar regras de negócio na UI.

Foco/Pomodoro e Café continuam bloqueados.
