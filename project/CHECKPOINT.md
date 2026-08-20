# Checkpoint do Projeto

## Estado atual

**Fase:** 4 — Atividades, implementação concluída; validação CI pendente  
**Branch:** `phase/04-atividades`  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Fases concluídas

- [x] Fase 0 — Especificação.
- [x] Fase 1 — Fundação.
- [x] Fase 2 — Jornada.
- [x] Fase 3 — Pausas.

## Implementado na Fase 4

- [x] Entidade `Activity` e regras puras de domínio.
- [x] Criar atividade dentro da jornada ativa.
- [x] Editar atividade pendente ou ativa.
- [x] Iniciar atividade.
- [x] Concluir atividade.
- [x] Cancelar atividade.
- [x] Estados `pending`, `active`, `completed` e `cancelled`.
- [x] Apenas uma atividade ativa por jornada.
- [x] Proteção contra início concorrente de duas atividades.
- [x] Duração calculada por timestamps.
- [x] Validação de nome, descrição e timestamps.
- [x] Dexie schema v4 com tabela `activities`.
- [x] Repositório Dexie para atividades.
- [x] Recuperação de atividade ativa após refresh/reabertura.
- [x] Ecrã Atividades funcional e responsivo.
- [x] Atividade atual apresentada no ecrã Hoje.
- [x] Atividade ativa concluída automaticamente ao terminar a jornada.
- [x] Testes de domínio.
- [x] Testes dos casos de uso.
- [x] Testes de exclusividade de atividade ativa.
- [x] Testes de persistência e concorrência IndexedDB.
- [x] Teste de encerramento consistente da jornada com atividade e pausa ativas.

## Validação necessária antes de concluir a Fase 4

- [ ] GitHub Actions: typecheck verde.
- [ ] GitHub Actions: lint verde.
- [ ] GitHub Actions: testes verdes.
- [ ] GitHub Actions: build verde.
- [ ] Revisão técnica final da Fase 4.

## Fora desta fase

Continuam bloqueados:

- Foco/Pomodoro;
- Café;
- dashboard final integrado;
- estatísticas completas.

## Próximo gate

A Fase 5 — Foco/Pomodoro só pode iniciar depois de todos os gates acima estarem verdes e a Fase 4 ser integrada em `main`.
