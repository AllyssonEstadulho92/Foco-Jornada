# Checkpoint do Projeto

## Estado atual

**Fase:** 1 — Fundação concluída  
**Próxima fase:** 2 — Jornada  
**PR da Fase 1:** #6  
**Validação CI:** GitHub Actions run `32410154499` — sucesso  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Implementado e validado na Fase 1

- [x] React + TypeScript + Vite.
- [x] TypeScript strict.
- [x] Estrutura por camadas em `src/`.
- [x] React Router.
- [x] Zustand para estado de interface.
- [x] Dexie/IndexedDB preparado.
- [x] Vitest + Testing Library.
- [x] ESLint + Prettier.
- [x] PWA configurada.
- [x] Navegação responsiva mobile/desktop.
- [x] Páginas Hoje, Atividades, Foco, Histórico, Mais e Definições.
- [x] Design tokens e layout escuro base.
- [x] CI com typecheck + lint + testes + build.
- [x] GitHub Actions: typecheck verde.
- [x] GitHub Actions: lint verde.
- [x] GitHub Actions: testes verdes.
- [x] GitHub Actions: build verde.

## Resultado dos quality gates

- Typecheck: **PASS**
- Lint: **PASS**
- Testes: **PASS**
- Build: **PASS**

## Próximo trabalho autorizado

A Fase 2 pode iniciar depois de a PR #6 ser integrada em `main`.

Escopo da Fase 2: **Jornada apenas** — iniciar, impedir duplicados, persistir em IndexedDB, recuperar após refresh/reabertura, calcular duração por timestamps e terminar com consistência.

Pausas, Atividades, Foco e Café continuam bloqueados.

## Regra de continuidade

Antes de começar uma nova fase, atualizar este ficheiro com:

- fase concluída;
- testes executados;
- resultado do build;
- decisões tomadas;
- riscos e problemas pendentes.
