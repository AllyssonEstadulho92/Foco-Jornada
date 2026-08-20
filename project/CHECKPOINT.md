# Checkpoint do Projeto

## Estado atual

**Versão:** V1 implementada  
**Branch de release:** `release/v1-finalizacao`  
**PR de release:** #11  
**Fonte de verdade:** `project/PROJECT_SPEC.md`

## Fases

- [x] Fase 0 — Especificação.
- [x] Fase 1 — Fundação.
- [x] Fase 2 — Jornada.
- [x] Fase 3 — Pausas.
- [x] Fase 4 — Atividades.
- [x] Fase 5 — Foco/Pomodoro.
- [x] Fase 6 — Café.
- [x] Fase 7 — Dashboard.
- [x] Fase 8 — Histórico, Estatísticas e Definições.
- [x] Fase 9 — Qualidade/PWA implementada.

## Funcionalidades da release

- Jornada persistente e recuperável.
- Pausas e cálculo de tempo efetivo.
- Atividades com exclusividade de atividade ativa.
- Pomodoro e foco personalizado persistentes.
- Café com preço configurável e totais diários.
- Dashboard integrado.
- Timeline diária e resumo.
- Estatísticas de 1, 7 e 30 dias.
- Definições persistentes.
- Exportação JSON do relatório diário.
- PWA com manifest, ícone e cache offline.

## Gate de integração

A PR #11 só pode ser integrada em `main` quando todos estes checks estiverem verdes:

- Typecheck: **PASS**
- Lint: **PASS**
- Testes: **PASS**
- Build: **PASS**

Depois da integração, `main` representa a V1 funcional. Evoluções como autenticação, sincronização cloud e publicação nativa ficam para V2.
