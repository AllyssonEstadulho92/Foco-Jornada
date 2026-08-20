# Roadmap — Foco & Jornada V1

## Estado das fases

| Fase | Objetivo | Estado | Gate para avançar |
|---|---|---|---|
| 0 | Especificação | Concluída | `PROJECT_SPEC.md` aprovado |
| 1 | Fundação | Concluída | Typecheck, lint, testes e build verdes |
| 2 | Jornada | Concluída | Persistência, recuperação e concorrência validadas |
| 3 | Pausas | Próxima | Cálculo de tempo efetivo validado |
| 4 | Atividades | Bloqueada | Apenas uma atividade ativa |
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
- separação inicial `domain/application/infrastructure/presentation/shared`;
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

## Fase 3 — Pausas — PRÓXIMA

- 15 min, 60 min e personalizada.
- Apenas uma pausa ativa por jornada.
- Persistência e recuperação.
- Cálculo de tempo efetivo.

## Fase 4 — Atividades

- CRUD e estados.
- Apenas uma atividade ativa.
- Persistência e duração por timestamps.

## Fase 5 — Foco/Pomodoro

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
