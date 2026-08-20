# Checkpoint do Projeto

## Estado atual

**Fase:** 2 — Jornada concluída  
**Próxima fase:** 3 — Pausas  
**PR da Fase 2:** #7  
**Validação CI:** GitHub Actions run `32410930364` — sucesso  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Fases concluídas

- [x] Fase 0 — Especificação.
- [x] Fase 1 — Fundação.
- [x] Fase 2 — Jornada.

## Implementado e validado na Fase 2

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

## Resultado dos quality gates

- Typecheck: **PASS**
- Lint: **PASS**
- Testes: **PASS**
- Build: **PASS**

## Próximo trabalho autorizado

A Fase 3 pode iniciar depois de a PR #7 ser integrada em `main`.

Escopo: **Pausas apenas** — 15 min, 60 min e personalizada, uma pausa ativa por jornada, persistência/recuperação e cálculo do tempo efetivo.

Atividades, Foco e Café continuam bloqueados.
