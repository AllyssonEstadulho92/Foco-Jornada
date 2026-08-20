# Roadmap — Foco & Jornada V1

## Estado das fases

| Fase | Objetivo | Estado | Gate para avançar |
|---|---|---|---|
| 0 | Especificação | Concluída | `PROJECT_SPEC.md` aprovado |
| 1 | Fundação | Concluída | Typecheck, lint, testes e build verdes |
| 2 | Jornada | Concluída | Persistência, recuperação e concorrência validadas |
| 3 | Pausas | Concluída | Tempo efetivo, persistência e CI verdes |
| 4 | Atividades | Concluída | Exclusividade, persistência e CI verdes |
| 5 | Foco/Pomodoro | Concluída | Timer persistente e CI verdes |
| 6 | Café | Próxima | Registos e totais consistentes |
| 7 | Dashboard | Bloqueada | Integração sem duplicação de lógica |
| 8 | Histórico/Estatísticas/Definições | Bloqueada | Agregações corretas |
| 9 | Qualidade final/PWA | Bloqueada | V1 cumpre critérios de aceitação |

## Fases 1–5 — CONCLUÍDAS

A fundação, Jornada, Pausas, Atividades e Foco/Pomodoro estão implementados e passaram typecheck, lint, testes e build no GitHub Actions.

### Fase 5 — Foco/Pomodoro

- Pomodoro 25/5/15 com 4 ciclos.
- Sessão personalizada.
- Pausar/retomar/concluir/cancelar.
- Associação opcional a atividade.
- Persistência por timestamps e recuperação após refresh.
- Apenas uma sessão aberta por jornada.
- Encerramento consistente ao terminar jornada.
- Testes de domínio, aplicação e IndexedDB.

---

## Fase 6 — Café — PRÓXIMA

- Quantidade, preço e total diário.
- Persistência e histórico.

## Fase 7 — Dashboard

- Integrar Jornada, Pausas, Atividades, Foco e Café no Hoje.
- Não duplicar regras de domínio.

## Fase 8 — Histórico, Estatísticas e Definições

- Timeline diária.
- Agregações dia/semana/mês.
- Definições persistentes.
- Exportação básica de dados.

## Fase 9 — Qualidade final e PWA

- Acessibilidade.
- Responsividade.
- Offline/PWA.
- Estados de erro.
- Testes críticos.
- Validação integral dos critérios de aceitação.
