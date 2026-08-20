# Checkpoint do Projeto

## Estado atual

**Fase:** 3 — Pausas, implementação concluída; validação CI pendente  
**Branch:** `phase/03-pausas`  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Fases concluídas

- [x] Fase 0 — Especificação.
- [x] Fase 1 — Fundação.
- [x] Fase 2 — Jornada.

## Implementado na Fase 3

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

## Validação necessária antes de concluir a Fase 3

- [ ] GitHub Actions: typecheck verde.
- [ ] GitHub Actions: lint verde.
- [ ] GitHub Actions: testes verdes.
- [ ] GitHub Actions: build verde.
- [ ] Revisão técnica final da Fase 3.

## Fora desta fase

Continuam bloqueados:

- Atividades funcionais;
- Foco/Pomodoro;
- Café;
- dashboard final integrado;
- estatísticas completas.

## Próximo gate

A Fase 4 — Atividades só pode iniciar depois de todos os gates acima estarem verdes e a Fase 3 ser integrada em `main`.
