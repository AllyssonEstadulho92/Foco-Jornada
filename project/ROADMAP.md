# Roadmap — Foco & Jornada V1

## Estado das fases

| Fase | Objetivo | Estado | Gate para avançar |
|---|---|---|---|
| 0 | Especificação | Concluída | `PROJECT_SPEC.md` aprovado |
| 1 | Fundação | Em curso | Build, lint e testes verdes |
| 2 | Jornada | Bloqueada | Persistência e recuperação validadas |
| 3 | Pausas | Bloqueada | Cálculo de tempo efetivo validado |
| 4 | Atividades | Bloqueada | Apenas uma atividade ativa |
| 5 | Foco/Pomodoro | Bloqueada | Timer persistente após refresh |
| 6 | Café | Bloqueada | Registos e totais consistentes |
| 7 | Dashboard | Bloqueada | Integração sem duplicação de lógica |
| 8 | Histórico/Estatísticas/Definições | Bloqueada | Agregações corretas |
| 9 | Qualidade final/PWA | Bloqueada | V1 cumpre critérios de aceitação |

## Fase 1 — Fundação

### Já existe no repositório

- React + TypeScript + Vite básicos.
- TypeScript strict.
- Estrutura inicial `domain/application/infrastructure/presentation/shared`.
- Design tokens e CSS base.
- Workflow inicial de typecheck/build.

### Falta concluir

- React Router.
- Zustand.
- Dexie/IndexedDB.
- Vitest e React Testing Library quando aplicável.
- ESLint + Prettier.
- PWA.
- Layout responsivo definitivo da fundação.
- Navegação mobile/desktop.
- Páginas vazias: Hoje, Atividades, Foco, Histórico, Mais e Definições.
- Atualizar CI para lint + testes + build.

### Não fazer nesta fase

- Não implementar Jornada.
- Não implementar Pausas.
- Não implementar Atividades reais.
- Não implementar Pomodoro.
- Não implementar Café.

### Critérios de saída

- `npm run lint` sem erros.
- `npm test` sem falhas.
- `npm run build` sem erros.
- Navegação funciona em mobile e desktop.
- Nenhuma regra de domínio relevante fica na UI.

---

## Fase 2 — Jornada

- Criar/iniciar/terminar jornada.
- Impedir duas jornadas ativas.
- Persistir em IndexedDB.
- Recuperar após refresh/reabertura.
- Calcular duração por timestamps.
- Testar regras críticas e idempotência.

## Fase 3 — Pausas

- 15 min, 60 min e personalizada.
- Apenas uma pausa ativa.
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
