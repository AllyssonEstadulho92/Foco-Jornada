# Checkpoint do Projeto

## Estado atual

**Fase:** 2 — Jornada, implementação concluída; validação CI pendente  
**Branch:** `phase/02-jornada`  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Fundação

Fase 1 concluída e integrada em `main`. Quality gates verdes.

## Implementado na Fase 2

- [x] Entidade `Journey` e regras puras de domínio.
- [x] Iniciar jornada.
- [x] Impedir duas jornadas ativas.
- [x] Proteção contra criação concorrente por transação IndexedDB.
- [x] Terminar jornada.
- [x] Proteção contra dupla finalização.
- [x] Duração calculada por timestamps persistidos.
- [x] Dexie schema v2 com tabela `journeys`.
- [x] Repositório Dexie para jornadas.
- [x] Recuperação da jornada ativa ao abrir/recarregar a interface.
- [x] Lista básica das jornadas do dia.
- [x] Interface Hoje com entrada, duração, estado, iniciar e terminar.
- [x] Confirmação antes de terminar jornada.
- [x] Testes de casos de uso.
- [x] Testes de persistência e concorrência com IndexedDB em memória.

## Validação necessária antes de concluir a Fase 2

- [ ] GitHub Actions: typecheck verde.
- [ ] GitHub Actions: lint verde.
- [ ] GitHub Actions: testes verdes.
- [ ] GitHub Actions: build verde.
- [ ] Revisão técnica final da Fase 2.

## Fora desta fase

Continuam bloqueados:

- Pausas;
- Atividades funcionais;
- Foco/Pomodoro;
- Café;
- estatísticas completas.

## Próximo gate

A Fase 3 — Pausas só pode iniciar depois de todos os gates acima estarem verdes e a Fase 2 ser integrada em `main`.
