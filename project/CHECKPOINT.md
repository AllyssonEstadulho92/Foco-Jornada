# Checkpoint do Projeto

## Estado atual

**Fase:** 4 — Atividades concluída  
**Próxima fase:** 5 — Foco/Pomodoro  
**PR da Fase 4:** #9  
**Validação CI:** GitHub Actions run `32413765506` — sucesso  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Fases concluídas

- [x] Fase 0 — Especificação.
- [x] Fase 1 — Fundação.
- [x] Fase 2 — Jornada.
- [x] Fase 3 — Pausas.
- [x] Fase 4 — Atividades.

## Implementado e validado na Fase 4

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

## Resultado dos quality gates

- Typecheck: **PASS**
- Lint: **PASS**
- Testes: **PASS**
- Build: **PASS**

## Próximo trabalho autorizado

A Fase 5 — Foco/Pomodoro pode iniciar depois de a PR #9 ser integrada em `main`.

Escopo: Pomodoro padrão e personalizado, pausar/retomar, ciclos, associação opcional a atividade e persistência baseada em timestamps.

Café continua bloqueado até a Fase 5 ser concluída e validada.
