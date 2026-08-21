# Checkpoint do Projeto

## Estado atual

**Versão:** V1 — candidata final após auditoria  
**Branch de auditoria:** `fix/v1-final-audit`  
**PR de auditoria:** #39  
**Fonte funcional principal:** `project/PROJECT_SPEC.md`  
**Registo de fecho:** `project/docs/V1_FINAL_AUDIT.md`

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
- [x] Fase 9 — Qualidade/PWA implementada e auditada.

## Funcionalidades da release

- Jornada persistente e recuperável.
- Pausas e cálculo de tempo efetivo.
- Atividades com exclusividade de atividade ativa.
- Pomodoro e foco personalizado persistentes.
- Café com preço configurável e totais diários.
- Dashboard/Hojе com jornada linear e próximo evento.
- Timeline diária, resumo e eliminação controlada de registos.
- Estatísticas de 1, 7 e 30 dias.
- Definições persistentes.
- Calculadora de horas e ausências, incluindo doença, consultas e horas extra.
- Vencimento e planificação mensal parametrizáveis.
- Guia de utilização integrado.
- Exportação JSON do relatório diário.
- PWA com manifest, service worker, atualização automática e cache offline.
- Interface neutra, clara e responsiva para mobile e computador.

## Auditoria final — PR #39

Corrigidos os dois bloqueadores identificados na auditoria:

1. PWA restaurada com configuração relativa compatível com GitHub Pages; deixou de existir limpeza automática de service workers/caches no arranque.
2. Zoom do browser voltou a ser permitido; `viewport-fit=cover` e safe areas mantêm-se.

Validação automática da PR #39:

- Typecheck: **PASS**
- Lint: **PASS** — permanece 1 warning não bloqueante em `TodayPage.tsx` relativo à dependência de `useMemo`.
- Testes: **PASS — 54/54**
- Build: **PASS**
- Build PWA: **PASS** — gera `manifest.webmanifest`, `registerSW.js`, `sw.js` e Workbox.

## Pontos não bloqueantes para evolução

- validar manualmente a apresentação final em Safari/iPhone, Android, tablet e monitores largos;
- eliminar o warning de `useMemo` do ecrã Hoje quando esse ficheiro voltar a ser alterado;
- considerar code splitting/lazy loading para reduzir o bundle principal, atualmente acima do aviso de 500 kB do Vite;
- manter as limitações do simulador de vencimento claramente identificadas quando existam regimes fiscais, contributivos ou convencionais específicos.

Depois da integração da PR #39, `main` representa a V1 funcional auditada. Autenticação, sincronização cloud, backups online, CSV/PDF e publicação nativa permanecem para V2.
