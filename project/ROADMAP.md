# Roadmap — Foco & Jornada V1

## Estado das fases

| Fase | Objetivo | Estado | Gate para avançar |
|---|---|---|---|
| 0 | Especificação | Concluída | `PROJECT_SPEC.md` aprovado |
| 1 | Fundação | Concluída | Typecheck, lint, testes e build verdes |
| 2 | Jornada | Concluída | Persistência, recuperação e concorrência validadas |
| 3 | Pausas | Concluída | Tempo efetivo, persistência e CI verdes |
| 4 | Atividades | Em validação | Apenas uma atividade ativa, persistência e CI verdes |
| 5 | Foco/Pomodoro | Bloqueada | Timer persistente após refresh |
| 6 | Café | Bloqueada | Registos e totais consistentes |
| 7 | Dashboard | Bloqueada | Integração sem duplicação de lógica |
| 8 | Histórico/Estatísticas/Definições | Bloqueada | Agregações corretas |
| 9 | Qualidade final/PWA | Bloqueada | V1 cumpre critérios de aceitação |

## Fase 1 — Fundação — CONCLUÍDA

Implementado:

- React + TypeScript + Vite;
- TypeScript strict;
- React Router;
- Zustand;
- Dexie/IndexedDB preparado;
- Vitest + React Testing Library;
- ESLint + Prettier;
- configuração PWA;
- separação `domain/application/infrastructure/presentation/shared`;
- design tokens e CSS responsivo;
- navegação mobile/desktop;
- páginas Hoje, Atividades, Foco, Histórico, Mais e Definições;
- CI com typecheck, lint, testes e build.

Validação: **PASS** em typecheck, lint, testes e build.

---

## Fase 2 — Jornada — CONCLUÍDA

Implementado:

- iniciar e terminar jornada;
- impedir duas jornadas ativas;
- operações concorrentes protegidas por transações;
- persistência IndexedDB;
- recuperação após refresh/reabertura;
- duração calculada por timestamps;
- histórico básico diário;
- interface funcional no ecrã Hoje;
- testes de domínio/aplicação e persistência.

Validação: **PASS** em typecheck, lint, testes e build.

---

## Fase 3 — Pausas — CONCLUÍDA

Implementado:

- 15 min, 60 min e personalizada;
- apenas uma pausa ativa por jornada;
- pausa apenas dentro de jornada ativa;
- persistência IndexedDB no schema v3;
- recuperação após refresh/reabertura;
- duração real consolidada;
- cálculo de tempo efetivo;
- estado `Em pausa`;
- histórico de pausas;
- encerramento automático de pausa ativa ao terminar jornada;
- testes de domínio, casos de uso, cálculo e persistência/concorrência.

Validação GitHub Actions: **PASS** em typecheck, lint, testes e build.

---

## Fase 4 — Atividades — EM VALIDAÇÃO

Implementado:

- criar, editar, iniciar, concluir e cancelar atividades;
- estados pendente, em curso, concluída e cancelada;
- apenas uma atividade ativa por jornada;
- proteção contra início concorrente;
- persistência IndexedDB no schema v4;
- recuperação após refresh/reabertura;
- duração calculada por timestamps;
- ecrã Atividades funcional e responsivo;
- atividade atual apresentada no Hoje;
- encerramento consistente da atividade ativa ao terminar a jornada;
- testes de domínio, casos de uso, duração, persistência e concorrência.

Gate atual: GitHub Actions e revisão final.

---

## Fase 5 — Foco/Pomodoro — BLOQUEADA

- Pomodoro padrão e personalizado.
- Pausar/retomar/ciclos.
- Persistência por timestamps.
- Associação opcional a atividade.

## Fase 6 — Café

- Quantidade, preço e total diário.
- Persistência e histórico.

## Fase 7 — Dashboard

- Integrar Jornada, Pausas, Atividades, Foco e Café no Hoje.
- Não duplicar regras de domínio.

## Fase 8 — Histórico, Estatísticas e Definições

- Timeline diária.
- Agregações dia/semana/mês.
- Definições persistentes.

## Fase 9 — Qualidade final e PWA

- Acessibilidade.
- Responsividade.
- Offline/PWA.
- Estados de erro.
- Testes críticos.
- Validação integral dos critérios de aceitação.
